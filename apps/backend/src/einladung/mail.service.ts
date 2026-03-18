import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
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

  async einladungSenden(
    email: string,
    vorname: string,
    vereinsname: string,
    link: string,
    anzahlFormulare: number = 0,
  ): Promise<void> {
    const formularHinweis =
      anzahlFormulare > 0
        ? `<p>Es ${anzahlFormulare === 1 ? 'muss 1 Formular' : `muessen ${anzahlFormulare} Formulare`} ausgefuellt und unterschrieben werden.</p>`
        : '';

    const htmlInhalt = `<h2>Hallo ${vorname},</h2>
      <p>Sie wurden zum <strong>${vereinsname}</strong> eingeladen.</p>
      ${formularHinweis}
      <p>Bitte fuellen Sie die Unterlagen aus:</p>
      <p><a href="${link}" style="background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Unterlagen ausfuellen</a></p>
      <p>Der Link ist 30 Tage gueltig.</p>
      <p>Mit sportlichen Gruessen,<br>${vereinsname}</p>`;

    if (!this.transporter) {
      console.log(`[Mail] SMTP nicht konfiguriert. Einladung an ${email}: ${link}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@clubos.de',
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
  ): Promise<void> {
    const htmlInhalt = `<h2>Willkommen beim ${vereinsname}, ${vorname}!</h2>
      <p>Ihr Mitgliedskonto wurde aktiviert. Hier sind Ihre Zugangsdaten:</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 12px;font-weight:bold;">E-Mail:</td><td style="padding:4px 12px;">${email}</td></tr>
        <tr><td style="padding:4px 12px;font-weight:bold;">Passwort:</td><td style="padding:4px 12px;font-family:monospace;background:#f3f4f6;padding:4px 8px;border-radius:4px;">${temporaeresPasswort}</td></tr>
      </table>
      <p>Bitte aendern Sie Ihr Passwort nach dem ersten Login.</p>
      <p><a href="${loginUrl}" style="background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Jetzt einloggen</a></p>
      <p>Mit sportlichen Gruessen,<br>${vereinsname}</p>`;

    if (!this.transporter) {
      console.log(
        `[Mail] SMTP nicht konfiguriert. Login-Daten an ${email}: Passwort=${temporaeresPasswort}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@clubos.de',
      to: email,
      subject: `Ihre Zugangsdaten fuer ${vereinsname}`,
      html: htmlInhalt,
    });
  }
}
