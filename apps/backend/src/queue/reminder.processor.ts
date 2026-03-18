import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from './queue.service';

@Processor('erinnerung')
export class ReminderProcessor {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Verarbeitet faellige Erinnerungen:
   * 1. Findet alle Erinnerungen, deren Zeitpunkt erreicht ist (scheduledFor <= jetzt)
   *    und die noch nicht gesendet wurden (sentAt ist null).
   * 2. Laedt die zugehoerigen Event- und Team-Daten.
   * 3. Erstellt fuer jedes Team-Mitglied einen E-Mail-Job in der Email-Queue.
   * 4. Markiert die Erinnerung als gesendet.
   */
  @Process('faellige-erinnerungen')
  async faelligeErinnerungenVerarbeiten(job: Job): Promise<void> {
    this.logger.log('Suche nach faelligen Erinnerungen...');

    try {
      const jetzt = new Date();

      const faelligeErinnerungen = await this.prisma.reminder.findMany({
        where: {
          scheduledFor: { lte: jetzt },
          sentAt: null,
        },
        include: {
          event: {
            include: {
              team: {
                include: {
                  teamMembers: {
                    include: {
                      member: true,
                    },
                  },
                },
              },
              tenant: true,
            },
          },
        },
      });

      if (faelligeErinnerungen.length === 0) {
        this.logger.log('Keine faelligen Erinnerungen gefunden');
        return;
      }

      this.logger.log(
        `${faelligeErinnerungen.length} faellige Erinnerung(en) gefunden`,
      );

      for (const erinnerung of faelligeErinnerungen) {
        const { event } = erinnerung;
        const vereinsname = event.tenant.name;
        const eventDatum = event.date.toLocaleDateString('de-DE', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const teamMitglieder = event.team.teamMembers;

        this.logger.log(
          `Erinnerung fuer "${event.title}" an ${teamMitglieder.length} Mitglied(er) senden`,
        );

        for (const teamMitglied of teamMitglieder) {
          const mitglied = teamMitglied.member;

          // E-Mail-Adresse ermitteln: Mitglied-E-Mail oder Eltern-E-Mail (fuer Jugendliche)
          const empfaengerEmail = mitglied.email || mitglied.parentEmail;

          if (!empfaengerEmail) {
            this.logger.warn(
              `Keine E-Mail-Adresse fuer Mitglied ${mitglied.firstName} ${mitglied.lastName} (${mitglied.id})`,
            );
            continue;
          }

          await this.queueService.erinnerungEmailSenden({
            email: empfaengerEmail,
            vorname: mitglied.firstName,
            vereinsname,
            eventTitel: event.title,
            eventDatum,
            eventOrt: event.location,
            hallAddress: event.hallAddress || undefined,
          });
        }

        // Erinnerung als gesendet markieren
        await this.prisma.reminder.update({
          where: { id: erinnerung.id },
          data: { sentAt: jetzt },
        });

        this.logger.log(
          `Erinnerung "${erinnerung.id}" fuer "${event.title}" erfolgreich verarbeitet`,
        );
      }
    } catch (fehler) {
      this.logger.error(`Fehler beim Verarbeiten der Erinnerungen: ${fehler}`);
      throw fehler;
    }
  }
}
