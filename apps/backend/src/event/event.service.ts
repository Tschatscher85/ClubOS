import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleEventDto, AktualisiereEventDto } from './dto/erstelle-event.dto';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async erstellen(tenantId: string, dto: ErstelleEventDto) {
    return this.prisma.event.create({
      data: {
        title: dto.titel,
        type: dto.typ,
        date: new Date(dto.datum),
        endDate: dto.endDatum ? new Date(dto.endDatum) : null,
        location: dto.ort,
        hallName: dto.hallenName,
        hallAddress: dto.hallenAdresse,
        teamId: dto.teamId,
        tenantId,
        notes: dto.notizen,
      },
      include: { team: true },
    });
  }

  async alleAbrufen(tenantId: string) {
    return this.prisma.event.findMany({
      where: { tenantId },
      include: {
        team: { select: { id: true, name: true, sport: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async kommendeAbrufen(tenantId: string) {
    return this.prisma.event.findMany({
      where: {
        tenantId,
        date: { gte: new Date() },
      },
      include: {
        team: { select: { id: true, name: true, sport: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { date: 'asc' },
      take: 20,
    });
  }

  async nachIdAbrufen(tenantId: string, id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, tenantId },
      include: {
        team: true,
        attendances: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    return event;
  }

  async aktualisieren(tenantId: string, id: string, dto: AktualisiereEventDto) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.titel !== undefined && { title: dto.titel }),
        ...(dto.typ !== undefined && { type: dto.typ }),
        ...(dto.datum !== undefined && { date: new Date(dto.datum) }),
        ...(dto.endDatum !== undefined && {
          endDate: dto.endDatum ? new Date(dto.endDatum) : null,
        }),
        ...(dto.ort !== undefined && { location: dto.ort }),
        ...(dto.hallenName !== undefined && { hallName: dto.hallenName }),
        ...(dto.hallenAdresse !== undefined && { hallAddress: dto.hallenAdresse }),
        ...(dto.notizen !== undefined && { notes: dto.notizen }),
      },
      include: { team: true },
    });
  }

  async loeschen(tenantId: string, id: string) {
    await this.nachIdAbrufen(tenantId, id);
    return this.prisma.event.delete({ where: { id } });
  }

  async naechstesEvent(tenantId: string) {
    return this.prisma.event.findFirst({
      where: {
        tenantId,
        date: { gte: new Date() },
      },
      include: {
        team: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    });
  }
}
