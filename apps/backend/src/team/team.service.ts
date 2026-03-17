import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleTeamDto, AktualisiereTeamDto } from './dto/erstelle-team.dto';
import { MitgliedHinzufuegenDto } from './dto/team-mitglied.dto';

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
        _count: { select: { events: true, teamMembers: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async meineTeams(tenantId: string, trainerId: string) {
    return this.prisma.team.findMany({
      where: { tenantId, trainerId },
      include: {
        _count: { select: { events: true, teamMembers: true } },
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
        teamMembers: {
          include: {
            member: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { events: true, teamMembers: true } },
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

  // ==================== Kader-Verwaltung ====================

  async mitgliederAbrufen(tenantId: string, teamId: string) {
    await this.nachIdAbrufen(tenantId, teamId);

    return this.prisma.teamMember.findMany({
      where: { teamId },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
            phone: true,
            parentEmail: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async mitgliedHinzufuegen(
    tenantId: string,
    teamId: string,
    dto: MitgliedHinzufuegenDto,
  ) {
    await this.nachIdAbrufen(tenantId, teamId);

    // Pruefen ob Mitglied zum Verein gehoert
    const mitglied = await this.prisma.member.findFirst({
      where: { id: dto.memberId, tenantId },
    });
    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    // Pruefen ob bereits im Team
    const vorhanden = await this.prisma.teamMember.findUnique({
      where: { teamId_memberId: { teamId, memberId: dto.memberId } },
    });
    if (vorhanden) {
      throw new ConflictException('Mitglied ist bereits im Team.');
    }

    return this.prisma.teamMember.create({
      data: {
        teamId,
        memberId: dto.memberId,
        rolle: dto.rolle || 'SPIELER',
      },
      include: { member: true },
    });
  }

  async mitgliedEntfernen(tenantId: string, teamId: string, memberId: string) {
    await this.nachIdAbrufen(tenantId, teamId);

    const eintrag = await this.prisma.teamMember.findUnique({
      where: { teamId_memberId: { teamId, memberId } },
    });
    if (!eintrag) {
      throw new NotFoundException('Mitglied ist nicht in diesem Team.');
    }

    return this.prisma.teamMember.delete({
      where: { id: eintrag.id },
    });
  }
}
