import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleTrikotDto } from './dto/erstelle-trikot.dto';
import { TrikotAusgebenDto } from './dto/trikot-ausgeben.dto';

@Injectable()
export class TrikotService {
  constructor(private prisma: PrismaService) {}

  /**
   * Alle Trikots eines Teams mit aktuellem Vergabestatus abrufen
   */
  async alleAbrufen(tenantId: string, teamId: string) {
    // Team pruefen
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });
    if (!team) {
      throw new NotFoundException('Team nicht gefunden.');
    }

    const trikots = await this.prisma.trikot.findMany({
      where: { teamId },
      include: {
        vergaben: {
          orderBy: { vergabenAm: 'desc' },
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
        },
      },
      orderBy: { nummer: 'asc' },
    });

    return trikots.map((trikot) => {
      const aktuelleVergabe = trikot.vergaben.find((v) => !v.zurueckAm) ?? null;
      return {
        ...trikot,
        aktuelleVergabe,
        istVerfuegbar: !aktuelleVergabe,
      };
    });
  }

  /**
   * Neues Trikot erstellen
   */
  async erstellen(tenantId: string, teamId: string, dto: ErstelleTrikotDto) {
    // Team pruefen
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });
    if (!team) {
      throw new NotFoundException('Team nicht gefunden.');
    }

    // Pruefen ob Trikotnummer + Farbe schon existiert
    const vorhanden = await this.prisma.trikot.findUnique({
      where: {
        teamId_nummer_farbe: {
          teamId,
          nummer: dto.nummer,
          farbe: dto.farbe ?? '',
        },
      },
    });
    if (vorhanden) {
      throw new ConflictException(
        `Trikot mit Nummer ${dto.nummer} und Typ "${dto.farbe || ''}" existiert bereits.`,
      );
    }

    return this.prisma.trikot.create({
      data: {
        teamId,
        nummer: dto.nummer,
        groesse: dto.groesse,
        farbe: dto.farbe,
        zustand: dto.zustand,
      },
    });
  }

  /**
   * Trikot an Mitglied ausgeben
   */
  async ausgeben(tenantId: string, trikotId: string, dto: TrikotAusgebenDto) {
    const trikot = await this.trikotPruefen(tenantId, trikotId);

    // Pruefen ob bereits ausgegeben
    const aktuelleVergabe = await this.prisma.trikotVergabe.findFirst({
      where: { trikotId, zurueckAm: null },
    });
    if (aktuelleVergabe) {
      throw new ConflictException('Trikot ist bereits ausgegeben.');
    }

    // Pruefen ob Mitglied existiert
    const mitglied = await this.prisma.member.findFirst({
      where: { id: dto.memberId, tenantId },
    });
    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    return this.prisma.trikotVergabe.create({
      data: {
        trikotId,
        memberId: dto.memberId,
        notiz: dto.notiz,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Trikot zurueckbuchen (zurueckAm setzen)
   */
  async zurueckbuchen(tenantId: string, trikotId: string) {
    await this.trikotPruefen(tenantId, trikotId);

    const aktuelleVergabe = await this.prisma.trikotVergabe.findFirst({
      where: { trikotId, zurueckAm: null },
      orderBy: { vergabenAm: 'desc' },
    });
    if (!aktuelleVergabe) {
      throw new BadRequestException('Trikot ist nicht ausgegeben.');
    }

    return this.prisma.trikotVergabe.update({
      where: { id: aktuelleVergabe.id },
      data: { zurueckAm: new Date() },
    });
  }

  /**
   * Trikot loeschen
   */
  async loeschen(tenantId: string, trikotId: string) {
    await this.trikotPruefen(tenantId, trikotId);
    return this.prisma.trikot.delete({ where: { id: trikotId } });
  }

  /**
   * Alle ausstehenden (nicht zurueckgegebenen) Trikots eines Teams
   */
  async ausstehend(tenantId: string, teamId: string) {
    // Team pruefen
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });
    if (!team) {
      throw new NotFoundException('Team nicht gefunden.');
    }

    const vergaben = await this.prisma.trikotVergabe.findMany({
      where: {
        trikot: { teamId },
        zurueckAm: null,
      },
      include: {
        trikot: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
      orderBy: { vergabenAm: 'asc' },
    });

    return vergaben;
  }

  /**
   * Hilfsmethode: Trikot pruefen und Tenant-Zugehoerigkeit sicherstellen
   */
  private async trikotPruefen(tenantId: string, trikotId: string) {
    const trikot = await this.prisma.trikot.findUnique({
      where: { id: trikotId },
      include: { team: { select: { tenantId: true } } },
    });
    if (!trikot || trikot.team.tenantId !== tenantId) {
      throw new NotFoundException('Trikot nicht gefunden.');
    }
    return trikot;
  }
}
