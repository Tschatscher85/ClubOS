import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReminderType } from '@prisma/client';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Erstellt automatisch H24- und H2-Erinnerungen fuer ein Event.
   * H24 = 24 Stunden vor dem Event
   * H2 = 2 Stunden vor dem Event
   */
  async erinnerungenErstellen(eventId: string, eventDatum: Date) {
    const h24 = new Date(eventDatum);
    h24.setHours(h24.getHours() - 24);

    const h2 = new Date(eventDatum);
    h2.setHours(h2.getHours() - 2);

    const jetzt = new Date();
    const erinnerungen = [];

    // H24-Erinnerung nur erstellen, wenn noch in der Zukunft
    if (h24 > jetzt) {
      erinnerungen.push({
        eventId,
        type: ReminderType.H24,
        scheduledFor: h24,
      });
    }

    // H2-Erinnerung nur erstellen, wenn noch in der Zukunft
    if (h2 > jetzt) {
      erinnerungen.push({
        eventId,
        type: ReminderType.H2,
        scheduledFor: h2,
      });
    }

    if (erinnerungen.length > 0) {
      await this.prisma.reminder.createMany({
        data: erinnerungen,
        skipDuplicates: true,
      });
      this.logger.log(
        `${erinnerungen.length} Erinnerung(en) fuer Event ${eventId} erstellt.`,
      );
    }

    return erinnerungen;
  }

  /**
   * Verarbeitet alle faelligen Erinnerungen.
   * Findet Erinnerungen mit scheduledFor <= jetzt, die noch nicht gesendet wurden.
   * Markiert sie als gesendet (sentAt). Tatsaechliche Push-Benachrichtigung folgt spaeter.
   */
  async faelligeErinnerungenVerarbeiten() {
    const jetzt = new Date();

    const faelligeErinnerungen = await this.prisma.reminder.findMany({
      where: {
        scheduledFor: { lte: jetzt },
        sentAt: null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
            hallName: true,
            hallAddress: true,
            teamId: true,
            tenantId: true,
          },
        },
      },
    });

    if (faelligeErinnerungen.length === 0) {
      this.logger.debug('Keine faelligen Erinnerungen gefunden.');
      return [];
    }

    this.logger.log(
      `${faelligeErinnerungen.length} faellige Erinnerung(en) gefunden. Verarbeite...`,
    );

    const verarbeitete = [];

    for (const erinnerung of faelligeErinnerungen) {
      // TODO: Hier spaeter Push-Notification / E-Mail senden
      this.logger.log(
        `Erinnerung ${erinnerung.type} fuer Event "${erinnerung.event.title}" ` +
        `(${erinnerung.event.date.toISOString()}) wird verarbeitet.`,
      );

      // Als gesendet markieren
      await this.prisma.reminder.update({
        where: { id: erinnerung.id },
        data: { sentAt: jetzt },
      });

      verarbeitete.push({
        erinnerungId: erinnerung.id,
        typ: erinnerung.type,
        eventTitel: erinnerung.event.title,
        eventDatum: erinnerung.event.date,
      });
    }

    this.logger.log(
      `${verarbeitete.length} Erinnerung(en) erfolgreich verarbeitet.`,
    );

    return verarbeitete;
  }
}
