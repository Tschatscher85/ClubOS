import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from './queue.service';
import { MitgliederbindungService } from '../mitgliederbindung/mitgliederbindung.service';

@Processor('mitgliederbindung')
export class MitgliederbindungProcessor {
  private readonly logger = new Logger(MitgliederbindungProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly mitgliederbindungService: MitgliederbindungService,
  ) {}

  /**
   * Woechentlicher Job (Montag 07:00): Analysiert alle Mitglieder auf Kuendigungsrisiko.
   * Fuer Mitglieder mit Ampel ROT wird ein KI-Kontaktvorschlag generiert.
   * Admins werden per Push benachrichtigt.
   */
  @Process('woechentlich-analysieren')
  async woechentlichAnalysieren(job: Job): Promise<void> {
    this.logger.log('Starte woechentliche Mitgliederbindungs-Analyse...');

    try {
      // Alle Tenants mit KI-Freischaltung laden
      const tenants = await this.prisma.tenant.findMany({
        where: { kiFreigeschaltet: true },
        select: { id: true, name: true },
      });

      this.logger.log(`${tenants.length} Verein(e) mit KI-Freischaltung gefunden`);

      for (const tenant of tenants) {
        try {
          await this.tenantAnalysieren(tenant.id, tenant.name);
        } catch (err) {
          this.logger.warn(
            `Analyse fuer Verein "${tenant.name}" (${tenant.id}) fehlgeschlagen: ${err}`,
          );
        }
      }

      this.logger.log('Woechentliche Mitgliederbindungs-Analyse abgeschlossen');
    } catch (error) {
      this.logger.error('Fehler bei woechentlicher Analyse:', error);
      throw error;
    }
  }

  private async tenantAnalysieren(tenantId: string, tenantName: string): Promise<void> {
    this.logger.log(`Analysiere Verein "${tenantName}"...`);

    const ergebnisse = await this.mitgliederbindungService.risikoAnalyse(tenantId);

    const roteMitglieder = ergebnisse.filter((r) => r.ampel === 'rot');
    const gelbeMitglieder = ergebnisse.filter((r) => r.ampel === 'gelb');

    this.logger.log(
      `${tenantName}: ${roteMitglieder.length} rot, ${gelbeMitglieder.length} gelb, ` +
      `${ergebnisse.length - roteMitglieder.length - gelbeMitglieder.length} gruen`,
    );

    // Fuer rote Mitglieder KI-Vorschlaege generieren (maximal 10 pro Durchlauf)
    const maxVorschlaege = Math.min(roteMitglieder.length, 10);
    for (let i = 0; i < maxVorschlaege; i++) {
      try {
        await this.mitgliederbindungService.kontaktVorschlag(
          tenantId,
          roteMitglieder[i].mitglied.id,
        );
      } catch (err) {
        this.logger.debug(
          `KI-Vorschlag fuer ${roteMitglieder[i].mitglied.firstName} ${roteMitglieder[i].mitglied.lastName} fehlgeschlagen: ${err}`,
        );
      }
    }

    // Push an alle Admins senden
    if (roteMitglieder.length > 0 || gelbeMitglieder.length > 0) {
      const fokusAnzahl = roteMitglieder.length + gelbeMitglieder.length;

      const admins = await this.prisma.user.findMany({
        where: {
          tenantId,
          role: { in: ['ADMIN', 'TRAINER'] },
        },
        select: { id: true },
      });

      for (const admin of admins) {
        try {
          await this.queueService.pushBenachrichtigungSenden({
            empfaengerId: admin.id,
            titel: 'Mitgliederbindung',
            nachricht: `${fokusAnzahl} Mitglieder im Fokus diese Woche (${roteMitglieder.length} kritisch)`,
          });
        } catch (err) {
          this.logger.debug(`Push an Admin ${admin.id} fehlgeschlagen: ${err}`);
        }
      }
    }
  }
}
