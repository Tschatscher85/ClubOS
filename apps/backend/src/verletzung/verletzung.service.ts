import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleVerletzungDto, AktualisiereVerletzungDto } from './dto/erstelle-verletzung.dto';
import { RehaStatus } from '@prisma/client';

@Injectable()
export class VerletzungService {
  constructor(private prisma: PrismaService) {}

  /** Neue Verletzung erfassen */
  async erstellen(tenantId: string, erstelltVon: string, dto: ErstelleVerletzungDto) {
    // Pruefen ob Mitglied existiert und zum Verein gehoert
    const mitglied = await this.prisma.member.findFirst({
      where: { id: dto.memberId, tenantId },
    });

    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden oder gehoert nicht zu diesem Verein.');
    }

    return this.prisma.verletzung.create({
      data: {
        memberId: dto.memberId,
        tenantId,
        art: dto.art,
        koerperteil: dto.koerperteil,
        pauseVoraus: dto.pauseVoraus,
        notiz: dto.notiz,
        erstelltVon,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
    });
  }

  /** Verletzung aktualisieren (Status, Zurueck-Datum, Notiz) */
  async aktualisieren(tenantId: string, id: string, dto: AktualisiereVerletzungDto) {
    const verletzung = await this.prisma.verletzung.findFirst({
      where: { id, tenantId },
    });

    if (!verletzung) {
      throw new NotFoundException('Verletzung nicht gefunden.');
    }

    return this.prisma.verletzung.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status as RehaStatus } : {}),
        ...(dto.zurueckAm ? { zurueckAm: new Date(dto.zurueckAm) } : {}),
        ...(dto.notiz !== undefined ? { notiz: dto.notiz } : {}),
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
    });
  }

  /** Verletzungshistorie eines Mitglieds */
  async fuerMitglied(tenantId: string, memberId: string) {
    return this.prisma.verletzung.findMany({
      where: { tenantId, memberId },
      orderBy: { datum: 'desc' },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
    });
  }

  /** Alle aktuellen Verletzungen eines Teams */
  async fuerTeam(tenantId: string, teamId: string) {
    // Erst Team-Mitglieder laden
    const teamMitglieder = await this.prisma.teamMember.findMany({
      where: {
        team: { id: teamId, tenantId },
      },
      select: { memberId: true },
    });

    const memberIds = teamMitglieder.map((tm) => tm.memberId);

    if (memberIds.length === 0) {
      return [];
    }

    return this.prisma.verletzung.findMany({
      where: {
        tenantId,
        memberId: { in: memberIds },
        status: { not: 'FIT' },
      },
      orderBy: { datum: 'desc' },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
    });
  }

  /** Alle aktiven Verletzungen im gesamten Verein */
  async aktiveImVerein(tenantId: string) {
    return this.prisma.verletzung.findMany({
      where: {
        tenantId,
        status: { not: 'FIT' },
      },
      orderBy: { datum: 'desc' },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
    });
  }
}
