import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleTrainingsprotokollDto } from './dto/erstelle-trainingsprotokoll.dto';

@Injectable()
export class TrainingsprotokollService {
  private readonly logger = new Logger(TrainingsprotokollService.name);

  constructor(private prisma: PrismaService) {}

  /** Trainingsprotokoll erstellen */
  async erstellen(
    tenantId: string,
    teamId: string,
    trainerId: string,
    dto: ErstelleTrainingsprotokollDto,
  ) {
    // Team pruefen
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });

    if (!team) {
      throw new NotFoundException('Team nicht gefunden.');
    }

    return this.prisma.trainingsprotokoll.create({
      data: {
        teamId,
        tenantId,
        trainerId,
        datum: new Date(dto.datum),
        dauer: dto.dauer,
        thema: dto.thema,
        inhalt: dto.inhalt || null,
        notizen: dto.notizen || null,
        teilnehmer: dto.teilnehmer as unknown as Prisma.InputJsonValue,
      },
      include: { team: true },
    });
  }

  /** Alle Trainingsprotokolle eines Teams laden */
  async alleVonTeam(tenantId: string, teamId: string) {
    return this.prisma.trainingsprotokoll.findMany({
      where: { tenantId, teamId },
      include: { team: true },
      orderBy: { datum: 'desc' },
    });
  }

  /** Einzelnes Trainingsprotokoll laden */
  async abrufen(tenantId: string, id: string) {
    const protokoll = await this.prisma.trainingsprotokoll.findFirst({
      where: { id, tenantId },
      include: { team: true },
    });

    if (!protokoll) {
      throw new NotFoundException('Trainingsprotokoll nicht gefunden.');
    }

    return protokoll;
  }

  /** Trainingsprotokoll loeschen */
  async loeschen(tenantId: string, id: string) {
    const protokoll = await this.prisma.trainingsprotokoll.findFirst({
      where: { id, tenantId },
    });

    if (!protokoll) {
      throw new NotFoundException('Trainingsprotokoll nicht gefunden.');
    }

    await this.prisma.trainingsprotokoll.delete({ where: { id } });

    return { geloescht: true };
  }
}
