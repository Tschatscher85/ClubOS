import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleFahrgemeinschaftDto } from './dto/erstelle-fahrgemeinschaft.dto';

@Injectable()
export class FahrgemeinschaftService {
  constructor(private prisma: PrismaService) {}

  /** Neue Fahrgemeinschaft erstellen */
  async erstellen(tenantId: string, userId: string, dto: ErstelleFahrgemeinschaftDto) {
    if (dto.eventId) {
      const event = await this.prisma.event.findFirst({
        where: { id: dto.eventId, tenantId },
      });
      if (!event) {
        throw new NotFoundException('Veranstaltung nicht gefunden.');
      }
    }

    return this.prisma.fahrgemeinschaft.create({
      data: {
        tenantId,
        fahrerId: userId,
        eventId: dto.eventId || null,
        startort: dto.startort,
        zielort: dto.zielort,
        abfahrt: new Date(dto.abfahrt),
        plaetze: dto.plaetze,
        kommentar: dto.kommentar || null,
      },
      include: {
        _count: { select: { mitfahrer: true } },
      },
    });
  }

  /** Alle Fahrgemeinschaften eines Vereins abrufen */
  async alleAbrufen(tenantId: string) {
    return this.prisma.fahrgemeinschaft.findMany({
      where: { tenantId },
      include: {
        _count: { select: { mitfahrer: true } },
      },
      orderBy: { abfahrt: 'asc' },
    });
  }

  /** Fahrgemeinschaften fuer ein bestimmtes Event abrufen */
  async fuerEvent(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    return this.prisma.fahrgemeinschaft.findMany({
      where: { tenantId, eventId },
      include: {
        mitfahrer: true,
        _count: { select: { mitfahrer: true } },
      },
      orderBy: { abfahrt: 'asc' },
    });
  }

  /** Als Mitfahrer eintragen */
  async mitfahren(tenantId: string, fahrgemeinschaftId: string, userId: string) {
    const fahrt = await this.prisma.fahrgemeinschaft.findFirst({
      where: { id: fahrgemeinschaftId, tenantId },
      include: { _count: { select: { mitfahrer: true } } },
    });

    if (!fahrt) {
      throw new NotFoundException('Fahrgemeinschaft nicht gefunden.');
    }

    if (fahrt.fahrerId === userId) {
      throw new BadRequestException('Sie sind bereits der Fahrer dieser Fahrgemeinschaft.');
    }

    const bereitsEingetragen = await this.prisma.mitfahrer.findFirst({
      where: { fahrgemeinschaftId, userId },
    });
    if (bereitsEingetragen) {
      throw new ConflictException('Sie sind bereits als Mitfahrer eingetragen.');
    }

    if (fahrt._count.mitfahrer >= fahrt.plaetze) {
      throw new BadRequestException('Keine freien Plaetze mehr verfuegbar.');
    }

    return this.prisma.mitfahrer.create({
      data: {
        fahrgemeinschaftId,
        userId,
      },
    });
  }

  /** Mitfahrt stornieren */
  async austreten(tenantId: string, fahrgemeinschaftId: string, userId: string) {
    const fahrt = await this.prisma.fahrgemeinschaft.findFirst({
      where: { id: fahrgemeinschaftId, tenantId },
    });
    if (!fahrt) {
      throw new NotFoundException('Fahrgemeinschaft nicht gefunden.');
    }

    const eintrag = await this.prisma.mitfahrer.findFirst({
      where: { fahrgemeinschaftId, userId },
    });
    if (!eintrag) {
      throw new NotFoundException('Sie sind nicht als Mitfahrer eingetragen.');
    }

    await this.prisma.mitfahrer.delete({ where: { id: eintrag.id } });
    return { nachricht: 'Mitfahrt erfolgreich storniert.' };
  }

  /** Fahrgemeinschaft loeschen — nur der Fahrer darf loeschen */
  async loeschen(tenantId: string, id: string, userId: string) {
    const fahrt = await this.prisma.fahrgemeinschaft.findFirst({
      where: { id, tenantId },
    });
    if (!fahrt) {
      throw new NotFoundException('Fahrgemeinschaft nicht gefunden.');
    }

    if (fahrt.fahrerId !== userId) {
      throw new ForbiddenException('Nur der Fahrer darf die Fahrgemeinschaft loeschen.');
    }

    await this.prisma.fahrgemeinschaft.delete({ where: { id } });
    return { nachricht: 'Fahrgemeinschaft erfolgreich geloescht.' };
  }
}
