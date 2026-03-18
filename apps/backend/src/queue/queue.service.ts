import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

/** Daten fuer Einladungs-E-Mails */
interface EinladungEmailDaten {
  email: string;
  vorname: string;
  vereinsname: string;
  link: string;
  anzahlFormulare?: number;
}

/** Daten fuer Login-Daten-E-Mails */
interface LoginDatenEmailDaten {
  email: string;
  vorname: string;
  vereinsname: string;
  temporaeresPasswort: string;
  loginUrl: string;
}

/** Daten fuer Erinnerungs-E-Mails */
interface ErinnerungEmailDaten {
  email: string;
  vorname: string;
  vereinsname: string;
  eventTitel: string;
  eventDatum: string;
  eventOrt: string;
  hallAddress?: string;
}

/** Daten fuer Notfall-Broadcast */
interface NotfallBroadcastDaten {
  empfaenger: Array<{
    email: string;
    vorname: string;
  }>;
  vereinsname: string;
  betreff: string;
  nachricht: string;
}

/** Daten fuer Push-Benachrichtigungen */
interface BenachrichtigungDaten {
  empfaengerId: string;
  titel: string;
  nachricht: string;
  daten?: Record<string, string>;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('erinnerung') private readonly erinnerungQueue: Queue,
    @InjectQueue('benachrichtigung')
    private readonly benachrichtigungQueue: Queue,
  ) {}

  /**
   * Fuegt einen Einladungs-E-Mail-Job zur Queue hinzu.
   */
  async einladungEmailSenden(daten: EinladungEmailDaten): Promise<void> {
    await this.emailQueue.add('einladung', daten, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
    this.logger.log(
      `Einladungs-E-Mail-Job fuer ${daten.email} zur Queue hinzugefuegt`,
    );
  }

  /**
   * Fuegt einen Login-Daten-E-Mail-Job zur Queue hinzu.
   */
  async loginDatenEmailSenden(daten: LoginDatenEmailDaten): Promise<void> {
    await this.emailQueue.add('loginDaten', daten, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
    this.logger.log(
      `Login-Daten-E-Mail-Job fuer ${daten.email} zur Queue hinzugefuegt`,
    );
  }

  /**
   * Fuegt einen Erinnerungs-E-Mail-Job zur Queue hinzu.
   */
  async erinnerungEmailSenden(daten: ErinnerungEmailDaten): Promise<void> {
    await this.emailQueue.add('erinnerung', daten, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
    this.logger.log(
      `Erinnerungs-E-Mail-Job fuer ${daten.email} zur Queue hinzugefuegt`,
    );
  }

  /**
   * Sendet einen Notfall-Broadcast an alle angegebenen Empfaenger.
   * Notfall-E-Mails werden mit hoher Prioritaet verarbeitet und
   * ignorieren die Stille-Stunden-Einstellung.
   */
  async notfallBroadcastSenden(daten: NotfallBroadcastDaten): Promise<void> {
    const { empfaenger, vereinsname, betreff, nachricht } = daten;

    this.logger.warn(
      `Notfall-Broadcast wird an ${empfaenger.length} Empfaenger gesendet: "${betreff}"`,
    );

    for (const person of empfaenger) {
      await this.emailQueue.add(
        'notfall',
        {
          email: person.email,
          vorname: person.vorname,
          vereinsname,
          betreff,
          nachricht,
        },
        {
          priority: 1, // Hoechste Prioritaet
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    }

    this.logger.warn(
      `${empfaenger.length} Notfall-Broadcast-Jobs zur Queue hinzugefuegt`,
    );
  }

  /**
   * Plant die Verarbeitung faelliger Erinnerungen.
   * Wird typischerweise per Cron-Job aufgerufen.
   */
  async faelligeErinnerungenVerarbeiten(): Promise<void> {
    await this.erinnerungQueue.add('faellige-erinnerungen', {}, {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 10000,
      },
    });
    this.logger.log('Job zum Verarbeiten faelliger Erinnerungen zur Queue hinzugefuegt');
  }

  /**
   * Fuegt eine Push-Benachrichtigung zur Queue hinzu.
   */
  async pushBenachrichtigungSenden(
    daten: BenachrichtigungDaten,
  ): Promise<void> {
    await this.benachrichtigungQueue.add('push', daten, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
    });
    this.logger.log(
      `Push-Benachrichtigungs-Job fuer Empfaenger ${daten.empfaengerId} zur Queue hinzugefuegt`,
    );
  }
}
