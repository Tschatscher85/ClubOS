import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { KiService } from '../ki/ki.service';
import { ErstelleSpielberichtDto, AktualisiereSpielberichtDto } from './dto/erstelle-spielbericht.dto';

@Injectable()
export class SpielberichtService {
  private readonly logger = new Logger(SpielberichtService.name);

  constructor(
    private prisma: PrismaService,
    private kiService: KiService,
  ) {}

  /** Spielbericht erstellen oder aktualisieren + KI-Text generieren */
  async erstellenOderAktualisieren(
    tenantId: string,
    eventId: string,
    dto: ErstelleSpielberichtDto,
  ) {
    // Event pruefen und Team-Namen laden
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      include: { team: true },
    });

    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    const teamName = event.team.name;

    // Torschuetzen fuer KI-Prompt formatieren
    const torschuetzenText = dto.torschuetzen
      ? (dto.torschuetzen as Array<{ name: string; minute?: number }>)
          .map((t) => (t.minute ? `${t.name} (${t.minute}.)` : t.name))
          .join(', ')
      : 'keine';

    // Spielbericht erstellen oder aktualisieren (upsert)
    const spielbericht = await this.prisma.spielbericht.upsert({
      where: { eventId },
      create: {
        eventId,
        tenantId,
        ergebnis: dto.ergebnis,
        gegner: dto.gegner,
        aufstellung: (dto.aufstellung as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        torschuetzen: (dto.torschuetzen as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        assists: (dto.assists as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        gelbeKarten: (dto.gelbeKarten as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        roteKarten: (dto.roteKarten as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        trainerNotiz: dto.trainerNotiz,
      },
      update: {
        ergebnis: dto.ergebnis,
        gegner: dto.gegner,
        aufstellung: (dto.aufstellung as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        torschuetzen: (dto.torschuetzen as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        assists: (dto.assists as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        gelbeKarten: (dto.gelbeKarten as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        roteKarten: (dto.roteKarten as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        trainerNotiz: dto.trainerNotiz,
      },
    });

    // KI-Text generieren (optional, wenn KI konfiguriert ist)
    let kiText: string | null = null;
    try {
      const kiAntwort = await this.kiService.textGenerieren(
        tenantId,
        'Du bist Sportjournalist fuer einen deutschen Vereinsblog.',
        `Schreibe einen kurzen, positiven Spielbericht (100-150 Woerter).
Mannschaft: ${teamName}
Gegner: ${dto.gegner}
Ergebnis: ${dto.ergebnis}
Torschuetzen: ${torschuetzenText}
Trainer-Notiz: ${dto.trainerNotiz || 'keine'}
Stil: locker, vereinsnah, motivierend, auf Deutsch.`,
      );
      kiText = kiAntwort.text;
    } catch (error) {
      this.logger.warn(
        `KI-Textgenerierung fehlgeschlagen fuer Event ${eventId}: ${(error as Error).message}`,
      );
      // Kein Fehler werfen — Bericht wird ohne KI-Text gespeichert
    }

    // KI-Text speichern wenn generiert
    if (kiText) {
      return this.prisma.spielbericht.update({
        where: { id: spielbericht.id },
        data: { kiText },
        include: { event: { include: { team: true } } },
      });
    }

    return this.prisma.spielbericht.findUnique({
      where: { id: spielbericht.id },
      include: { event: { include: { team: true } } },
    });
  }

  /** Einzelnen Spielbericht abrufen */
  async abrufen(tenantId: string, eventId: string) {
    const spielbericht = await this.prisma.spielbericht.findFirst({
      where: { eventId, tenantId },
      include: { event: { include: { team: true } } },
    });

    if (!spielbericht) {
      throw new NotFoundException('Spielbericht nicht gefunden.');
    }

    return spielbericht;
  }

  /** Spielbericht aktualisieren (KI-Text bearbeiten, veroeffentlichen) */
  async aktualisieren(
    tenantId: string,
    eventId: string,
    dto: AktualisiereSpielberichtDto,
  ) {
    const spielbericht = await this.prisma.spielbericht.findFirst({
      where: { eventId, tenantId },
    });

    if (!spielbericht) {
      throw new NotFoundException('Spielbericht nicht gefunden.');
    }

    return this.prisma.spielbericht.update({
      where: { id: spielbericht.id },
      data: {
        ...(dto.kiText !== undefined && { kiText: dto.kiText }),
        ...(dto.veroeffentlicht !== undefined && { veroeffentlicht: dto.veroeffentlicht }),
        ...(dto.ergebnis !== undefined && { ergebnis: dto.ergebnis }),
        ...(dto.gegner !== undefined && { gegner: dto.gegner }),
        ...(dto.torschuetzen !== undefined && { torschuetzen: dto.torschuetzen as Prisma.InputJsonValue }),
        ...(dto.assists !== undefined && { assists: dto.assists as Prisma.InputJsonValue }),
        ...(dto.gelbeKarten !== undefined && { gelbeKarten: dto.gelbeKarten as Prisma.InputJsonValue }),
        ...(dto.roteKarten !== undefined && { roteKarten: dto.roteKarten as Prisma.InputJsonValue }),
        ...(dto.trainerNotiz !== undefined && { trainerNotiz: dto.trainerNotiz }),
      },
      include: { event: { include: { team: true } } },
    });
  }

  /** Alle Spielberichte eines Teams abrufen */
  async alleVonTeam(tenantId: string, teamId: string) {
    return this.prisma.spielbericht.findMany({
      where: {
        tenantId,
        event: { teamId },
      },
      include: { event: { include: { team: true } } },
      orderBy: { erstelltAm: 'desc' },
    });
  }
}
