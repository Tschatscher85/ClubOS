import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailEinstellungenService } from '../email/email-einstellungen.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private dbTransporterGeladen = false;

  constructor(
    private configService: ConfigService,
    private emailEinstellungenService: EmailEinstellungenService,
    private prisma: PrismaService,
  ) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get<number>('SMTP_PORT') || 587,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  /**
   * Globalen Transporter aus PlattformConfig (DB) laden — Fallback wenn .env nicht gesetzt
   */
  private async globalenTransporterLaden(): Promise<nodemailer.Transporter | null> {
    if (this.transporter) return this.transporter;
    if (this.dbTransporterGeladen) return null;
    this.dbTransporterGeladen = true;

    try {
      const config = await this.prisma.plattformConfig.findUnique({
        where: { id: 'singleton' },
      });
      if (config?.smtpHost && config?.smtpUser && config?.smtpPass) {
        this.transporter = nodemailer.createTransport({
          host: config.smtpHost,
          port: config.smtpPort || 587,
          secure: (config.smtpPort || 587) === 465,
          auth: { user: config.smtpUser, pass: config.smtpPass },
        });
        return this.transporter;
      }
    } catch {
      // DB nicht erreichbar — ignorieren
    }
    return null;
  }

  /**
   * Transporter fuer einen bestimmten Benutzer erstellen.
   * Prueft zuerst die persoenlichen SMTP-Einstellungen, faellt auf den globalen Transporter zurueck.
   */
  async transporterFuerBenutzer(
    userId: string,
  ): Promise<nodemailer.Transporter | null> {
    // Persoenliche Einstellungen pruefen
    const persoenlicherTransporter =
      await this.emailEinstellungenService.transporterFuerBenutzer(userId);

    if (persoenlicherTransporter) {
      return persoenlicherTransporter;
    }

    // Fallback auf globalen Transporter (DB oder .env)
    return this.globalenTransporterLaden();
  }

  async einladungSenden(
    email: string,
    vorname: string,
    vereinsname: string,
    link: string,
    anzahlFormulare: number = 0,
    senderId?: string,
  ): Promise<void> {
    const formularHinweis =
      anzahlFormulare > 0
        ? `<p>Es ${anzahlFormulare === 1 ? 'muss 1 Formular' : `muessen ${anzahlFormulare} Formulare`} ausgefuellt und unterschrieben werden.</p>`
        : '';

    let absenderEmail =
      this.configService.get<string>('SMTP_FROM') || 'noreply@vereinbase.de';
    let absenderName = vereinsname;
    let signatur = '';

    // Persoenliche Absender-Infos laden, falls senderId vorhanden
    let aktuellerTransporter: nodemailer.Transporter | null = this.transporter;

    if (senderId) {
      const persoenlicheInfos =
        await this.emailEinstellungenService.absenderInfos(senderId);

      if (persoenlicheInfos) {
        absenderEmail = persoenlicheInfos.absenderEmail;
        absenderName = persoenlicheInfos.absenderName;
        signatur = persoenlicheInfos.signatur
          ? `<hr/>${persoenlicheInfos.signatur}`
          : '';
      }

      // Persoenlichen Transporter verwenden, falls vorhanden
      aktuellerTransporter = await this.transporterFuerBenutzer(senderId);
    }

    const htmlInhalt = `<h2>Hallo ${vorname},</h2>
      <p>Sie wurden zum <strong>${vereinsname}</strong> eingeladen.</p>
      ${formularHinweis}
      <p>Bitte fuellen Sie die Unterlagen aus:</p>
      <p><a href="${link}" style="background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Unterlagen ausfuellen</a></p>
      <p>Der Link ist 30 Tage gueltig.</p>
      <p>Mit sportlichen Gruessen,<br>${absenderName}</p>
      ${signatur}`;

    if (!aktuellerTransporter) {
      console.log(`[Mail] SMTP nicht konfiguriert. Einladung an ${email}: ${link}`);
      return;
    }

    await aktuellerTransporter.sendMail({
      from: `"${absenderName}" <${absenderEmail}>`,
      to: email,
      subject: `Einladung zum ${vereinsname}`,
      html: htmlInhalt,
    });
  }

  async loginDatenSenden(
    email: string,
    vorname: string,
    vereinsname: string,
    temporaeresPasswort: string,
    loginUrl: string,
    senderId?: string,
  ): Promise<void> {
    let absenderEmail =
      this.configService.get<string>('SMTP_FROM') || 'noreply@vereinbase.de';
    let absenderName = vereinsname;
    let signatur = '';

    let aktuellerTransporter: nodemailer.Transporter | null = this.transporter;

    if (senderId) {
      const persoenlicheInfos =
        await this.emailEinstellungenService.absenderInfos(senderId);

      if (persoenlicheInfos) {
        absenderEmail = persoenlicheInfos.absenderEmail;
        absenderName = persoenlicheInfos.absenderName;
        signatur = persoenlicheInfos.signatur
          ? `<hr/>${persoenlicheInfos.signatur}`
          : '';
      }

      aktuellerTransporter = await this.transporterFuerBenutzer(senderId);
    }

    const htmlInhalt = `<h2>Willkommen beim ${vereinsname}, ${vorname}!</h2>
      <p>Ihr Mitgliedskonto wurde aktiviert. Hier sind Ihre Zugangsdaten:</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 12px;font-weight:bold;">E-Mail:</td><td style="padding:4px 12px;">${email}</td></tr>
        <tr><td style="padding:4px 12px;font-weight:bold;">Passwort:</td><td style="padding:4px 12px;font-family:monospace;background:#f3f4f6;padding:4px 8px;border-radius:4px;">${temporaeresPasswort}</td></tr>
      </table>
      <p>Bitte aendern Sie Ihr Passwort nach dem ersten Login.</p>
      <p><a href="${loginUrl}" style="background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Jetzt einloggen</a></p>
      <p>Mit sportlichen Gruessen,<br>${absenderName}</p>
      ${signatur}`;

    if (!aktuellerTransporter) {
      console.log(
        `[Mail] SMTP nicht konfiguriert. Login-Daten an ${email}: Passwort=${temporaeresPasswort}`,
      );
      return;
    }

    await aktuellerTransporter.sendMail({
      from: `"${absenderName}" <${absenderEmail}>`,
      to: email,
      subject: `Ihre Zugangsdaten fuer ${vereinsname}`,
      html: htmlInhalt,
    });
  }

  async verifizierungsMailSenden(
    email: string,
    token: string,
    frontendUrl: string,
  ): Promise<void> {
    const link = `${frontendUrl}/email-verifizieren?token=${token}`;

    const htmlInhalt = `<h2>E-Mail-Adresse bestätigen</h2>
      <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihren Vereinbase-Account zu aktivieren.</p>
      <p><a href="${link}" style="background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">E-Mail bestätigen</a></p>
      <p>Der Link ist 24 Stunden gueltig.</p>
      <p>Falls Sie sich nicht bei Vereinbase registriert haben, ignorieren Sie diese E-Mail.</p>
      <p>Mit sportlichen Gruessen,<br>Vereinbase</p>`;

    const transporter = await this.globalenTransporterLaden();
    if (!transporter) {
      console.log(`[Mail] SMTP nicht konfiguriert. Verifizierung fuer ${email}: ${link}`);
      return;
    }

    const absenderEmail =
      this.configService.get<string>('SMTP_FROM') || 'noreply@vereinbase.de';

    await transporter.sendMail({
      from: `"Vereinbase" <${absenderEmail}>`,
      to: email,
      subject: 'Vereinbase — E-Mail-Adresse bestätigen',
      html: htmlInhalt,
    });
  }
}
