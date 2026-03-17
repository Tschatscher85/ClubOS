import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleTeamDto, AktualisiereTeamDto } from './dto/erstelle-team.dto';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async erstellen(tenantId: string, dto: ErstelleTeamDto) {
    return this.prisma.team.create({
      data: {
        name: dto.name,
        sport: dto.sportart,
        ageGroup: dto.altersklasse,
        trainerId: dto.trainerId,
        tenantId,
      },
    });
  }

  async alleAbrufen(tenantId: string) {
    return this.prisma.team.findMany({
      where: { tenantId },
      include: {
        _count: { select: { events: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async nachIdAbrufen(tenantId: string, id: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, tenantId },
      include: {
        events: {
          orderBy: { date: 'asc' },
          take: 10,
        },
        _count: { select: { events: true } },
      },
    });

    if (!team) {
      throw new NotFoundException('Team nicht gefunden.');
    }

    return team;
  }

  async aktualisieren(tenantId: string, id: string, dto: AktualisiereTeamDto) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.team.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.sportart !== undefined && { sport: dto.sportart }),
        ...(dto.altersklasse !== undefined && { ageGroup: dto.altersklasse }),
        ...(dto.trainerId !== undefined && { trainerId: dto.trainerId }),
      },
    });
  }

  async loeschen(tenantId: string, id: string) {
    await this.nachIdAbrufen(tenantId, id);
    return this.prisma.team.delete({ where: { id } });
  }

  async statistik(tenantId: string) {
    const gesamt = await this.prisma.team.count({ where: { tenantId } });
    return { gesamt };
  }
}
