import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { EmailEinstellungenDto } from './dto/email-einstellungen.dto';

@Injectable()
export class EmailEinstellungenService {
  constructor(private prisma: PrismaService) {}

  /**
   * Passwort Base64-kodiert speichern.
   * TODO: Richtige Verschluesselung mit AES-256-GCM implementieren.
   */
  private passwortKodieren(klartext: string): string {
    return Buffer.from(klartext, 'utf-8').toString('base64');
  }

  /**
   * Base64-kodiertes Passwort dekodieren.
   */
  private passwortDekodieren(kodiert: string): string {
    return Buffer.from(kodiert, 'base64').toString('utf-8');
  }

  /**
   * Passwort maskieren — zeigt nur die letzten 4 Zeichen.
   */
  private passwortMaskieren(klartext: string): string {
    if (klartext.length <= 4) {
      return '****';
    }
    return '*'.repeat(klartext.length - 4) + klartext.slice(-4);
  }

  /**
   * SMTP-Einstellungen speichern oder aktualisieren.
   */
  async speichern(userId: string, dto: EmailEinstellungenDto) {
    const kodiertesPasswort = this.passwortKodieren(dto.smtpPass);

    const einstellungen = await this.prisma.emailEinstellungen.upsert({
      where: { userId },
      create: {
        userId,
        smtpHost: dto.smtpHost,
        smtpPort: dto.smtpPort,
        smtpUser: dto.smtpUser,
        smtpPass: kodiertesPasswort,
        absenderEmail: dto.absenderEmail,
        absenderName: dto.absenderName,
        signatur: dto.signatur ?? null,
        istAktiv: dto.istAktiv ?? true,
      },
      update: {
        smtpHost: dto.smtpHost,
        smtpPort: dto.smtpPort,
        smtpUser: dto.smtpUser,
        smtpPass: kodiertesPasswort,
        absenderEmail: dto.absenderEmail,
        absenderName: dto.absenderName,
        signatur: dto.signatur ?? null,
        istAktiv: dto.istAktiv ?? true,
      },
    });

    return {
      ...einstellungen,
      smtpPass: this.passwortMaskieren(dto.smtpPass),
    };
  }

  /**
   * SMTP-Einstellungen abrufen (Passwort maskiert).
   */
  async abrufen(userId: string) {
    const einstellungen = await this.prisma.emailEinstellungen.findUnique({
      where: { userId },
    });

    if (!einstellungen) {
      return null;
    }

    const klartextPasswort = this.passwortDekodieren(einstellungen.smtpPass);

    return {
      ...einstellungen,
      smtpPass: this.passwortMaskieren(klartextPasswort),
    };
  }

  /**
   * SMTP-Einstellungen loeschen.
   */
  async loeschen(userId: string) {
    const vorhanden = await this.prisma.emailEinstellungen.findUnique({
      where: { userId },
    });

    if (!vorhanden) {
      throw new NotFoundException('Keine E-Mail-Einstellungen vorhanden.');
    }

    await this.prisma.emailEinstellungen.delete({
      where: { userId },
    });

    return { nachricht: 'E-Mail-Einstellungen wurden geloescht.' };
  }

  /**
   * Test-E-Mail senden, um SMTP-Konfiguration zu pruefen.
   */
  async testen(userId: string) {
    const einstellungen = await this.prisma.emailEinstellungen.findUnique({
      where: { userId },
    });

    if (!einstellungen) {
      throw new NotFoundException(
        'Keine E-Mail-Einstellungen vorhanden. Bitte zuerst konfigurieren.',
      );
    }

    if (!einstellungen.istAktiv) {
      throw new BadRequestException(
        'E-Mail-Einstellungen sind deaktiviert. Bitte zuerst aktivieren.',
      );
    }

    const klartextPasswort = this.passwortDekodieren(einstellungen.smtpPass);

    const transporter = nodemailer.createTransport({
      host: einstellungen.smtpHost,
      port: einstellungen.smtpPort,
      secure: einstellungen.smtpPort === 465,
      auth: {
        user: einstellungen.smtpUser,
        pass: klartextPasswort,
      },
    });

    try {
      // Verbindung testen
      await transporter.verify();

      // Test-E-Mail an eigene Adresse senden
      await transporter.sendMail({
        from: `"${einstellungen.absenderName}" <${einstellungen.absenderEmail}>`,
        to: einstellungen.absenderEmail,
        subject: 'Vereinbase — SMTP-Test erfolgreich',
        html: `
          <h2>SMTP-Test erfolgreich!</h2>
          <p>Ihre E-Mail-Einstellungen funktionieren korrekt.</p>
          <p>Diese Test-E-Mail wurde von Vereinbase gesendet.</p>
          ${einstellungen.signatur ? `<hr/>${einstellungen.signatur}` : ''}
        `,
      });

      return {
        erfolg: true,
        nachricht: 'Test-E-Mail wurde erfolgreich gesendet an ' + einstellungen.absenderEmail,
      };
    } catch (fehler: unknown) {
      const fehlermeldung =
        fehler instanceof Error ? fehler.message : 'Unbekannter Fehler';
      throw new BadRequestException(
        `SMTP-Verbindung fehlgeschlagen: ${fehlermeldung}`,
      );
    }
  }

  /**
   * Nodemailer-Transporter fuer einen bestimmten Benutzer erstellen.
   * Gibt null zurueck, wenn keine Einstellungen vorhanden oder deaktiviert.
   */
  async transporterFuerBenutzer(
    userId: string,
  ): Promise<nodemailer.Transporter | null> {
    const einstellungen = await this.prisma.emailEinstellungen.findUnique({
      where: { userId },
    });

    if (!einstellungen || !einstellungen.istAktiv) {
      return null;
    }

    const klartextPasswort = this.passwortDekodieren(einstellungen.smtpPass);

    const transporter = nodemailer.createTransport({
      host: einstellungen.smtpHost,
      port: einstellungen.smtpPort,
      secure: einstellungen.smtpPort === 465,
      auth: {
        user: einstellungen.smtpUser,
        pass: klartextPasswort,
      },
    });

    // Absender-Infos als Metadata anhaengen, damit der Aufrufer sie nutzen kann
    (transporter as nodemailer.Transporter & { absenderEmail: string; absenderName: string; signatur: string | null }).absenderEmail = einstellungen.absenderEmail;
    (transporter as nodemailer.Transporter & { absenderEmail: string; absenderName: string; signatur: string | null }).absenderName = einstellungen.absenderName;
    (transporter as nodemailer.Transporter & { absenderEmail: string; absenderName: string; signatur: string | null }).signatur = einstellungen.signatur;

    return transporter;
  }

  /**
   * Absender-Informationen fuer einen Benutzer abrufen.
   */
  async absenderInfos(
    userId: string,
  ): Promise<{ absenderEmail: string; absenderName: string; signatur: string | null } | null> {
    const einstellungen = await this.prisma.emailEinstellungen.findUnique({
      where: { userId },
      select: { absenderEmail: true, absenderName: true, signatur: true, istAktiv: true },
    });

    if (!einstellungen || !einstellungen.istAktiv) {
      return null;
    }

    return {
      absenderEmail: einstellungen.absenderEmail,
      absenderName: einstellungen.absenderName,
      signatur: einstellungen.signatur,
    };
  }
}
