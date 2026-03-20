import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from './queue.service';

@Processor('geburtstag')
export class GeburtstagProcessor {
  private readonly logger = new Logger(GeburtstagProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Taeglicher Job (08:00 Uhr): Prueft alle aktiven Mitglieder auf Geburtstag.
   * Sendet Push + E-Mail an die Trainer der jeweiligen Teams.
   */
  @Process('taeglich-pruefen')
  async geburtstagePruefen(job: Job): Promise<void> {
    this.logger.log('Pruefe heutige Geburtstage...');

    try {
      const heute = new Date();
      const tag = heute.getDate();
      const monat = heute.getMonth() + 1; // 1-12

      // Alle aktiven Mitglieder mit Geburtsdatum laden
      const alleMitglieder = await this.prisma.member.findMany({
        where: {
          status: 'ACTIVE',
          birthDate: { not: null },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          tenantId: true,
          teamMembers: {
            select: {
              team: {
                select: {
                  id: true,
                  name: true,
                  trainerId: true,
                },
              },
            },
          },
        },
      });

      // Geburtstagskinder filtern (gleicher Tag + Monat)
      const geburtstagskinder = alleMitglieder.filter((m) => {
        if (!m.birthDate) return false;
        const bd = new Date(m.birthDate);
        return bd.getDate() === tag && bd.getMonth() + 1 === monat;
      });

      if (geburtstagskinder.length === 0) {
        this.logger.log('Heute keine Geburtstage');
        return;
      }

      this.logger.log(`${geburtstagskinder.length} Geburtstagskind(er) gefunden`);

      // Pro Geburtstagskind: Trainer benachrichtigen
      for (const mitglied of geburtstagskinder) {
        const jahrgang = mitglied.birthDate
          ? new Date(mitglied.birthDate).getFullYear()
          : '';
        const alter = jahrgang
          ? heute.getFullYear() - Number(jahrgang)
          : null;

        const alterText = alter ? ` wird ${alter}` : '';
        const nachricht = `Heute hat ${mitglied.firstName} ${mitglied.lastName} (${jahrgang})${alterText} Geburtstag!`;

        // Alle Trainer der Teams des Mitglieds sammeln
        const trainerIds = new Set<string>();
        for (const tm of mitglied.teamMembers) {
          if (tm.team.trainerId) {
            trainerIds.add(tm.team.trainerId);
          }
        }

        // Push an jeden Trainer
        for (const trainerId of trainerIds) {
          try {
            await this.queueService.pushBenachrichtigungSenden({
              empfaengerId: trainerId,
              titel: '🎂 Geburtstag',
              nachricht,
            });
          } catch (err) {
            this.logger.warn(`Push an Trainer ${trainerId} fehlgeschlagen: ${err}`);
          }
        }

        // Auch Admins des Vereins benachrichtigen
        const admins = await this.prisma.user.findMany({
          where: {
            tenantId: mitglied.tenantId,
            role: 'ADMIN',
          },
          select: { id: true },
        });

        for (const admin of admins) {
          if (!trainerIds.has(admin.id)) {
            try {
              await this.queueService.pushBenachrichtigungSenden({
                empfaengerId: admin.id,
                titel: '🎂 Geburtstag',
                nachricht,
              });
            } catch (err) {
              this.logger.warn(`Push an Admin ${admin.id} fehlgeschlagen: ${err}`);
            }
          }
        }
      }

      this.logger.log(`Geburtstags-Benachrichtigungen versendet`);
    } catch (error) {
      this.logger.error('Fehler bei Geburtstags-Pruefung:', error);
      throw error;
    }
  }
}
