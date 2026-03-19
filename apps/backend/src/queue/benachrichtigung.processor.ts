import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PushService } from '../push/push.service';

interface BenachrichtigungJobDaten {
  empfaengerId: string;
  titel: string;
  nachricht: string;
  daten?: Record<string, string>;
}

@Processor('benachrichtigung')
export class BenachrichtigungProcessor {
  private readonly logger = new Logger(BenachrichtigungProcessor.name);

  constructor(private readonly pushService: PushService) {}

  @Process('push')
  async pushSenden(job: Job<BenachrichtigungJobDaten>): Promise<void> {
    const { empfaengerId, titel, nachricht, daten } = job.data;

    this.logger.log(
      `Push-Benachrichtigung wird gesendet an ${empfaengerId}: "${titel}"`,
    );

    try {
      // Stille-Stunden und Einstellungen pruefen
      const darfSenden = await this.pushService.darfPushSenden(empfaengerId);

      if (!darfSenden) {
        this.logger.debug(
          `Push fuer ${empfaengerId} zurueckgehalten (Stille Stunden oder Push deaktiviert)`,
        );
        return;
      }

      await this.pushService.sendePush(empfaengerId, {
        title: titel,
        body: nachricht,
        url: daten?.url,
      });

      this.logger.log(
        `Push-Benachrichtigung erfolgreich gesendet an ${empfaengerId}`,
      );
    } catch (fehler) {
      this.logger.error(
        `Fehler beim Senden der Push-Benachrichtigung an ${empfaengerId}: ${fehler}`,
      );
      throw fehler;
    }
  }
}
