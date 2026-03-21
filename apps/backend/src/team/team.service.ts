import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';
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
        sport: dto.sportart as any,
        ageGroup: dto.altersklasse,
        trainerId: dto.trainerId || null,
        abteilungId: dto.abteilungId || null,
        tenantId,
      },
    });
  }

  async alleAbrufen(tenantId: string) {
    return this.prisma.team.findMany({
      where: { tenantId },
      include: {
        _count: { select: { events: true, teamMembers: true, warteliste: true } },
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
        warteliste: {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                memberNumber: true,
                email: true,
              },
            },
          },
          orderBy: { angemeldetAm: 'asc' },
        },
        _count: { select: { events: true, teamMembers: true, warteliste: true } },
      },
    });

    if (!team) {
      throw new NotFoundException('Team nicht gefunden.');
    }

    return team;
  }

  async aktualisieren(tenantId: string, id: string, dto: AktualisiereTeamDto) {
    await this.nachIdAbrufen(tenantId, id);

    const sportWert = dto.sportart || dto.sport;
    const altersklasseWert = dto.altersklasse || dto.ageGroup;

    return this.prisma.team.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(sportWert !== undefined && { sport: sportWert }),
        ...(altersklasseWert !== undefined && { ageGroup: altersklasseWert }),
        ...(dto.trainerId !== undefined && { trainerId: dto.trainerId }),
        ...(dto.abteilungId !== undefined && { abteilungId: dto.abteilungId || null }),
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

  // ==================== Max-Kader ====================

  async maxKaderSetzen(tenantId: string, teamId: string, maxKader: number | null) {
    await this.nachIdAbrufen(tenantId, teamId);

    return this.prisma.team.update({
      where: { id: teamId },
      data: { maxKader },
    });
  }

  // ==================== Anwesenheitsstatistik ====================

  async anwesenheitStatistik(tenantId: string, teamId: string, wochen: number) {
    // Team pruefen
    await this.nachIdAbrufen(tenantId, teamId);

    const zeitraumStart = new Date(Date.now() - wochen * 7 * 24 * 3600000);
    const jetzt = new Date();

    // 1. Alle TRAINING-Events im Zeitraum laden
    const trainings = await this.prisma.event.findMany({
      where: {
        teamId,
        tenantId,
        type: 'TRAINING',
        date: {
          gte: zeitraumStart,
          lte: jetzt,
        },
      },
      include: {
        attendances: {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // 2. Alle Team-Mitglieder laden
    const teamMitglieder = await this.prisma.teamMember.findMany({
      where: { teamId },
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

    const anzahlTrainings = trainings.length;

    // 3. Fuer jedes Mitglied Statistik berechnen
    const mitglieder = teamMitglieder.map((tm) => {
      const memberId = tm.memberId;
      let kommt = 0;
      let fehlt = 0;
      let offen = 0;

      // Status pro Training (chronologisch neueste zuerst)
      const letzteTrainings: { datum: string; status: AttendanceStatus }[] = [];

      for (const training of trainings) {
        const anmeldung = training.attendances.find(
          (a) => a.memberId === memberId,
        );
        const status: AttendanceStatus = anmeldung?.status ?? 'PENDING';

        if (status === 'YES') {
          kommt++;
        } else if (status === 'NO') {
          fehlt++;
        } else {
          offen++;
        }

        letzteTrainings.push({
          datum: training.date.toISOString(),
          status,
        });
      }

      // Anwesenheitsquote: YES / Gesamtanzahl Trainings
      const anwesenheitsquote =
        anzahlTrainings > 0 ? Math.round((kommt / anzahlTrainings) * 100) : 0;

      // Fehlt in Folge: Aufeinanderfolgende NO/PENDING vom neuesten Training
      let fehltInFolge = 0;
      for (const eintrag of letzteTrainings) {
        if (eintrag.status === 'NO' || eintrag.status === 'PENDING') {
          fehltInFolge++;
        } else {
          break;
        }
      }

      return {
        id: memberId,
        name: `${tm.member.firstName} ${tm.member.lastName}`,
        anwesenheitsquote,
        kommt,
        fehlt,
        offen,
        letzteTrainings,
        fehltInFolge,
      };
    });

    // Team-Quote: Durchschnitt aller Mitglieder
    const teamQuote =
      mitglieder.length > 0
        ? Math.round(
            mitglieder.reduce((sum, m) => sum + m.anwesenheitsquote, 0) /
              mitglieder.length,
          )
        : 0;

    return {
      mitglieder,
      teamQuote,
      anzahlTrainings,
    };
  }
}
