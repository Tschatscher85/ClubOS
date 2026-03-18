import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleEinteilungDto } from './dto/erstelle-einteilung.dto';

@Injectable()
export class SchiedsrichterService {
  constructor(private prisma: PrismaService) {}

  /** Schiedsrichter manuell einteilen */
  async einteilen(tenantId: string, dto: ErstelleEinteilungDto) {
    // Pruefen ob bereits eingeteilt
    const vorhanden = await this.prisma.schiedsrichterEinteilung.findFirst({
      where: {
        tenantId,
        eventId: dto.eventId,
        memberId: dto.memberId,
      },
    });

    if (vorhanden) {
      throw new ConflictException(
        'Dieses Mitglied ist fuer dieses Event bereits als Schiedsrichter eingeteilt.',
      );
    }

    return this.prisma.schiedsrichterEinteilung.create({
      data: {
        tenantId,
        eventId: dto.eventId,
        memberId: dto.memberId,
        notiz: dto.notiz,
      },
    });
  }

  /** Alle Einteilungen abrufen, optional nach Event filtern */
  async alleAbrufen(tenantId: string, eventId?: string) {
    return this.prisma.schiedsrichterEinteilung.findMany({
      where: {
        tenantId,
        ...(eventId ? { eventId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Schiedsrichter bestaetigt seine Einteilung */
  async bestaetigen(tenantId: string, id: string) {
    const einteilung = await this.prisma.schiedsrichterEinteilung.findFirst({
      where: { id, tenantId },
    });

    if (!einteilung) {
      throw new NotFoundException('Schiedsrichter-Einteilung nicht gefunden.');
    }

    return this.prisma.schiedsrichterEinteilung.update({
      where: { id },
      data: {
        status: 'BESTAETIGT',
        bestaetigt: true,
      },
    });
  }

  /** Schiedsrichter lehnt seine Einteilung ab */
  async ablehnen(tenantId: string, id: string, grund?: string) {
    const einteilung = await this.prisma.schiedsrichterEinteilung.findFirst({
      where: { id, tenantId },
    });

    if (!einteilung) {
      throw new NotFoundException('Schiedsrichter-Einteilung nicht gefunden.');
    }

    return this.prisma.schiedsrichterEinteilung.update({
      where: { id },
      data: {
        status: 'ABGELEHNT',
        bestaetigt: false,
        notiz: grund
          ? `Abgelehnt: ${grund}`
          : einteilung.notiz,
      },
    });
  }

  /**
   * Automatisch Schiedsrichter einteilen.
   * Waehlt Mitglieder aus, die am laengsten nicht als Schiedsrichter
   * eingeteilt waren (faire Rotation).
   */
  async automatischEinteilen(tenantId: string, eventId: string) {
    // Event pruefen
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new NotFoundException('Event nicht gefunden.');
    }

    // Pruefen ob bereits ein Schiedsrichter eingeteilt ist
    const bereitsEingeteilt =
      await this.prisma.schiedsrichterEinteilung.findFirst({
        where: {
          tenantId,
          eventId,
          status: { in: ['EINGETEILT', 'BESTAETIGT'] },
        },
      });

    if (bereitsEingeteilt) {
      throw new ConflictException(
        'Fuer dieses Event ist bereits ein Schiedsrichter eingeteilt.',
      );
    }

    // Aktive Mitglieder des Vereins abrufen
    const aktiveMitglieder = await this.prisma.member.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (aktiveMitglieder.length === 0) {
      throw new NotFoundException(
        'Keine aktiven Mitglieder fuer die automatische Einteilung verfuegbar.',
      );
    }

    // Letzte Einteilungen pro Mitglied abrufen (wann zuletzt als Schiri)
    const letzteEinteilungen =
      await this.prisma.schiedsrichterEinteilung.findMany({
        where: {
          tenantId,
          memberId: { in: aktiveMitglieder.map((m) => m.id) },
          status: { in: ['EINGETEILT', 'BESTAETIGT'] },
        },
        orderBy: { createdAt: 'desc' },
      });

    // Map: memberId -> letzte Einteilung
    const letzteEinteilungMap = new Map<string, Date>();
    for (const e of letzteEinteilungen) {
      if (!letzteEinteilungMap.has(e.memberId)) {
        letzteEinteilungMap.set(e.memberId, e.createdAt);
      }
    }

    // Mitglieder sortieren: wer am laengsten nicht eingeteilt war, kommt zuerst
    // Mitglieder ohne bisherige Einteilung haben hoechste Prioritaet
    const sortierteMitglieder = [...aktiveMitglieder].sort((a, b) => {
      const datumA = letzteEinteilungMap.get(a.id);
      const datumB = letzteEinteilungMap.get(b.id);

      if (!datumA && !datumB) return 0;
      if (!datumA) return -1;
      if (!datumB) return 1;

      return datumA.getTime() - datumB.getTime();
    });

    // Erstes Mitglied (am laengsten nicht eingeteilt) waehlen
    const ausgewaehltesMitglied = sortierteMitglieder[0];

    return this.prisma.schiedsrichterEinteilung.create({
      data: {
        tenantId,
        eventId,
        memberId: ausgewaehltesMitglied.id,
        notiz: 'Automatisch eingeteilt (faire Rotation)',
      },
    });
  }
}
