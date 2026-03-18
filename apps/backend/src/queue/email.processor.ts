import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../einladung/mail.service';

/** Daten fuer Einladungs-E-Mails */
interface EinladungJobDaten {
  email: string;
  vorname: string;
  vereinsname: string;
  link: string;
  anzahlFormulare?: number;
}

/** Daten fuer Login-Daten-E-Mails */
interface LoginDatenJobDaten {
  email: string;
  vorname: string;
  vereinsname: string;
  temporaeresPasswort: string;
  loginUrl: string;
}

/** Daten fuer Erinnerungs-E-Mails */
interface ErinnerungJobDaten {
  email: string;
  vorname: string;
  vereinsname: string;
  eventTitel: string;
  eventDatum: string;
  eventOrt: string;
  hallAddress?: string;
}

/** Daten fuer Notfall-Broadcast-E-Mails */
interface NotfallJobDaten {
  email: string;
  vorname: string;
  vereinsname: string;
  betreff: string;
  nachricht: string;
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('einladung')
  async einladungVerarbeiten(job: Job<EinladungJobDaten>): Promise<void> {
    const { email, vorname, vereinsname, link, anzahlFormulare } = job.data;
    this.logger.log(`Einladungs-E-Mail wird an ${email} gesendet...`);

    try {
      await this.mailService.einladungSenden(
        email,
        vorname,
        vereinsname,
        link,
        anzahlFormulare,
      );
      this.logger.log(`Einladungs-E-Mail erfolgreich an ${email} gesendet`);
    } catch (fehler) {
      this.logger.error(
        `Fehler beim Senden der Einladungs-E-Mail an ${email}: ${fehler}`,
      );
      throw fehler;
    }
  }

  @Process('loginDaten')
  async loginDatenVerarbeiten(job: Job<LoginDatenJobDaten>): Promise<void> {
    const { email, vorname, vereinsname, temporaeresPasswort, loginUrl } =
      job.data;
    this.logger.log(`Login-Daten-E-Mail wird an ${email} gesendet...`);

    try {
      await this.mailService.loginDatenSenden(
        email,
        vorname,
        vereinsname,
        temporaeresPasswort,
        loginUrl,
      );
      this.logger.log(`Login-Daten-E-Mail erfolgreich an ${email} gesendet`);
    } catch (fehler) {
      this.logger.error(
        `Fehler beim Senden der Login-Daten-E-Mail an ${email}: ${fehler}`,
      );
      throw fehler;
    }
  }

  @Process('erinnerung')
  async erinnerungVerarbeiten(job: Job<ErinnerungJobDaten>): Promise<void> {
    const { email, vorname, vereinsname, eventTitel, eventDatum, eventOrt, hallAddress } =
      job.data;
    this.logger.log(
      `Erinnerungs-E-Mail fuer "${eventTitel}" wird an ${email} gesendet...`,
    );

    try {
      const mapsLink = hallAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hallAddress)}`
        : '';

      const ortsInfo = mapsLink
        ? `<a href="${mapsLink}">${eventOrt}</a>`
        : eventOrt;

      const htmlInhalt = `<h2>Hallo ${vorname},</h2>
        <p>Erinnerung an den bevorstehenden Termin:</p>
        <table style="border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:4px 12px;font-weight:bold;">Veranstaltung:</td><td style="padding:4px 12px;">${eventTitel}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold;">Datum:</td><td style="padding:4px 12px;">${eventDatum}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold;">Ort:</td><td style="padding:4px 12px;">${ortsInfo}</td></tr>
        </table>
        <p>Bitte melden Sie sich rechtzeitig an oder ab.</p>
        <p>Mit sportlichen Gruessen,<br>${vereinsname}</p>`;

      // Erinnerungs-E-Mails direkt ueber den Transporter senden
      // (MailService hat keinen generischen sendMail, daher verwenden wir einladungSenden als Workaround nicht,
      //  sondern loggen den Inhalt wenn SMTP nicht konfiguriert ist)
      await this.mailService['transporter']?.sendMail({
        from: 'noreply@clubos.de',
        to: email,
        subject: `Erinnerung: ${eventTitel} am ${eventDatum}`,
        html: htmlInhalt,
      });

      if (!this.mailService['transporter']) {
        this.logger.log(
          `[Mail] SMTP nicht konfiguriert. Erinnerung an ${email}: ${eventTitel} am ${eventDatum}`,
        );
      }

      this.logger.log(`Erinnerungs-E-Mail erfolgreich an ${email} gesendet`);
    } catch (fehler) {
      this.logger.error(
        `Fehler beim Senden der Erinnerungs-E-Mail an ${email}: ${fehler}`,
      );
      throw fehler;
    }
  }

  @Process('notfall')
  async notfallVerarbeiten(job: Job<NotfallJobDaten>): Promise<void> {
    const { email, vorname, vereinsname, betreff, nachricht } = job.data;
    this.logger.log(
      `Notfall-Broadcast-E-Mail wird an ${email} gesendet...`,
    );

    try {
      const htmlInhalt = `<h2 style="color:#dc2626;">DRINGENDE NACHRICHT - ${vereinsname}</h2>
        <p>Hallo ${vorname},</p>
        <p style="font-size:16px;font-weight:bold;">${nachricht}</p>
        <hr style="margin:16px 0;" />
        <p style="color:#666;font-size:12px;">
          Diese Nachricht wurde als Notfall-Broadcast gesendet und ignoriert die Stille-Stunden-Einstellung.
        </p>`;

      await this.mailService['transporter']?.sendMail({
        from: 'noreply@clubos.de',
        to: email,
        subject: `DRINGEND: ${betreff}`,
        html: htmlInhalt,
      });

      if (!this.mailService['transporter']) {
        this.logger.log(
          `[Mail] SMTP nicht konfiguriert. Notfall-Broadcast an ${email}: ${betreff}`,
        );
      }

      this.logger.log(
        `Notfall-Broadcast-E-Mail erfolgreich an ${email} gesendet`,
      );
    } catch (fehler) {
      this.logger.error(
        `Fehler beim Senden der Notfall-Broadcast-E-Mail an ${email}: ${fehler}`,
      );
      throw fehler;
    }
  }
}
