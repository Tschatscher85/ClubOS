import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WartelisteService } from '../warteliste/warteliste.service';

@Processor('warteliste')
export class WartelisteProcessor {
  private readonly logger = new Logger(WartelisteProcessor.name);

  constructor(private readonly wartelisteService: WartelisteService) {}

  /**
   * Stuendlicher Job: Prueft abgelaufene Wartelisten-Einladungen.
   * Setzt Status auf ABGELAUFEN und laedt den Naechsten ein.
   */
  @Process('abgelaufene-pruefen')
  async abgelaufenePruefen(job: Job): Promise<void> {
    this.logger.log('Pruefe abgelaufene Wartelisten-Einladungen...');

    try {
      await this.wartelisteService.abgelaufeneVerarbeiten();
      this.logger.log('Abgelaufene Wartelisten-Einladungen verarbeitet.');
    } catch (error) {
      this.logger.error('Fehler bei Wartelisten-Verarbeitung:', error);
      throw error;
    }
  }
}
