import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ErstellePinboardItemDto,
  AktualisierePinboardItemDto,
} from './dto/pinboard.dto';

@Injectable()
export class PinboardService {
  constructor(private prisma: PrismaService) {}

  /** Alle Pinboard-Eintraege eines Teams abrufen */
  async alleAbrufen(tenantId: string, teamId: string) {
    // Pruefen ob das Team zum Verein gehoert
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });

    if (!team) {
      throw new NotFoundException('Mannschaft nicht gefunden.');
    }

    return this.prisma.pinboardItem.findMany({
      where: { teamId, tenantId },
      orderBy: [
        { istAngepinnt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /** Neuen Pinboard-Eintrag erstellen */
  async erstellen(
    tenantId: string,
    teamId: string,
    userId: string,
    dto: ErstellePinboardItemDto,
  ) {
    // Pruefen ob das Team zum Verein gehoert
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });

    if (!team) {
      throw new NotFoundException('Mannschaft nicht gefunden.');
    }

    return this.prisma.pinboardItem.create({
      data: {
        tenantId,
        teamId,
        titel: dto.titel,
        inhalt: dto.inhalt,
        icon: dto.icon ?? 'info',
        istAngepinnt: dto.istAngepinnt ?? false,
        erstelltVon: userId,
      },
    });
  }

  /** Pinboard-Eintrag aktualisieren */
  async aktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisierePinboardItemDto,
  ) {
    const eintrag = await this.prisma.pinboardItem.findFirst({
      where: { id, tenantId },
    });

    if (!eintrag) {
      throw new NotFoundException('Pinboard-Eintrag nicht gefunden.');
    }

    return this.prisma.pinboardItem.update({
      where: { id },
      data: {
        ...(dto.titel !== undefined && { titel: dto.titel }),
        ...(dto.inhalt !== undefined && { inhalt: dto.inhalt }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.istAngepinnt !== undefined && { istAngepinnt: dto.istAngepinnt }),
      },
    });
  }

  /** Pinboard-Eintrag loeschen */
  async loeschen(tenantId: string, id: string) {
    const eintrag = await this.prisma.pinboardItem.findFirst({
      where: { id, tenantId },
    });

    if (!eintrag) {
      throw new NotFoundException('Pinboard-Eintrag nicht gefunden.');
    }

    return this.prisma.pinboardItem.delete({ where: { id } });
  }
}
