import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AttendanceStatus, FamilienRolle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleTeamDto, AktualisiereTeamDto } from './dto/erstelle-team.dto';
import { MitgliedHinzufuegenDto } from './dto/team-mitglied.dto';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  /**
   * Synchronisiert den Trainer als TeamMember mit Rolle TRAINER.
   * trainerId ist eine User-ID, daher wird das zugehoerige Member gesucht.
   */
  private async trainerAlsTeamMemberSynchronisieren(
    teamId: string,
    tenantId: string,
    neueTrainerUserId: string | null,
    alteTrainerUserId?: string | null,
  ) {
    // Alten Trainer-TeamMember entfernen (falls Trainer gewechselt)
    if (alteTrainerUserId && alteTrainerUserId !== neueTrainerUserId) {
      const altesMitglied = await this.prisma.member.findFirst({
        where: { userId: alteTrainerUserId, tenantId },
        select: { id: true },
      });
      if (altesMitglied) {
        await this.prisma.teamMember.deleteMany({
          where: { teamId, memberId: altesMitglied.id, rolle: 'TRAINER' },
        });
      }
    }

    // Neuen Trainer als TeamMember anlegen
    if (neueTrainerUserId) {
      const mitglied = await this.prisma.member.findFirst({
        where: { userId: neueTrainerUserId, tenantId },
        select: { id: true },
      });
      if (mitglied) {
        const vorhanden = await this.prisma.teamMember.findUnique({
          where: { teamId_memberId: { teamId, memberId: mitglied.id } },
        });
        if (!vorhanden) {
          await this.prisma.teamMember.create({
            data: { teamId, memberId: mitglied.id, rolle: 'TRAINER' },
          });
        } else if (vorhanden.rolle !== 'TRAINER') {
          // Mitglied ist schon im Team, aber nicht als Trainer — Rolle aktualisieren
          await this.prisma.teamMember.update({
            where: { id: vorhanden.id },
            data: { rolle: 'TRAINER' },
          });
        }
      }
    }
  }

  async erstellen(tenantId: string, dto: ErstelleTeamDto) {
    // Sportart von Abteilung uebernehmen, falls vorhanden
    let sportart = dto.sportart as any;
    if (dto.abteilungId) {
      const abteilung = await this.prisma.abteilung.findFirst({
        where: { id: dto.abteilungId, tenantId },
        select: { sport: true },
      });
      if (abteilung) {
        sportart = abteilung.sport;
      }
    }

    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        sport: sportart,
        ageGroup: dto.altersklasse,
        trainerId: dto.trainerId || null,
        abteilungId: dto.abteilungId || null,
        tenantId,
      },
    });

    // Trainer automatisch als TeamMember mit Rolle TRAINER anlegen
    if (dto.trainerId) {
      await this.trainerAlsTeamMemberSynchronisieren(team.id, tenantId, dto.trainerId);
    }

    return team;
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
    const altesTeam = await this.nachIdAbrufen(tenantId, id);

    const altersklasseWert = dto.altersklasse || dto.ageGroup;

    // Sportart von Abteilung uebernehmen, falls Abteilung geaendert wird
    let sportWert = dto.sportart || dto.sport;
    const abteilungId = dto.abteilungId !== undefined ? (dto.abteilungId || null) : undefined;
    if (abteilungId) {
      const abteilung = await this.prisma.abteilung.findFirst({
        where: { id: abteilungId, tenantId },
        select: { sport: true },
      });
      if (abteilung) {
        sportWert = abteilung.sport as any;
      }
    }

    const aktualisiert = await this.prisma.team.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(sportWert !== undefined && { sport: sportWert }),
        ...(altersklasseWert !== undefined && { ageGroup: altersklasseWert }),
        ...(dto.trainerId !== undefined && { trainerId: dto.trainerId }),
        ...(abteilungId !== undefined && { abteilungId }),
      },
    });

    // Trainer-TeamMember synchronisieren wenn trainerId geaendert wurde
    if (dto.trainerId !== undefined) {
      await this.trainerAlsTeamMemberSynchronisieren(
        id,
        tenantId,
        dto.trainerId || null,
        altesTeam.trainerId,
      );
    }

    return aktualisiert;
  }

  async loeschen(tenantId: string, id: string) {
    await this.nachIdAbrufen(tenantId, id);
    return this.prisma.team.delete({ where: { id } });
  }

  async statistik(tenantId: string) {
    const gesamt = await this.prisma.team.count({ where: { tenantId } });
    return { gesamt };
  }

  /**
   * Mappt vereinsRollen auf Team-Rolle.
   * Prioritaet: Trainer > Vorstand > Eltern > Spieler
   */
  private vereinsRolleZuTeamRolle(vereinsRollen: string[]): string {
    if (vereinsRollen.includes('Trainer')) return 'TRAINER';
    if (vereinsRollen.includes('Vorstand')) return 'VORSTAND';
    if (vereinsRollen.includes('Eltern')) return 'ELTERN';
    // Spieler, Jugendspieler, oder alles andere
    return 'SPIELER';
  }

  // ==================== Eltern-Automatik ====================

  /**
   * Wenn ein Kind zum Team hinzugefuegt wird, werden Eltern (MUTTER/VATER/ERZIEHUNGSBERECHTIGTER)
   * automatisch mit Rolle ELTERN hinzugefuegt.
   */
  private async elternAutomatischHinzufuegen(teamId: string, memberId: string) {
    // Pruefen ob dieses Mitglied ein KIND in einer Familie ist
    const kindEintraege = await this.prisma.familieMitglied.findMany({
      where: {
        memberId,
        rolle: FamilienRolle.KIND,
      },
      select: { familieId: true },
    });

    if (kindEintraege.length === 0) return;

    // Sportarten des Kindes und Team-Sportart laden
    const [kindMitglied, team] = await Promise.all([
      this.prisma.member.findUnique({
        where: { id: memberId },
        select: { sport: true },
      }),
      this.prisma.team.findUnique({
        where: { id: teamId },
        include: { abteilung: { select: { sport: true } } },
      }),
    ]);

    const familieIds = kindEintraege.map((k) => k.familieId);

    // Alle Elternteile in diesen Familien finden
    const elternEintraege = await this.prisma.familieMitglied.findMany({
      where: {
        familieId: { in: familieIds },
        rolle: { in: [FamilienRolle.MUTTER, FamilienRolle.VATER, FamilienRolle.ERZIEHUNGSBERECHTIGTER] },
      },
      select: { memberId: true, userId: true },
    });

    for (const eltern of elternEintraege) {
      // Eltern-MemberId ermitteln: direkt oder ueber userId
      let elternMemberId = eltern.memberId;
      if (!elternMemberId && eltern.userId) {
        const member = await this.prisma.member.findFirst({
          where: { userId: eltern.userId },
          select: { id: true },
        });
        if (member) elternMemberId = member.id;
      }
      if (!elternMemberId) continue;

      // Nur hinzufuegen wenn noch nicht im Team
      const vorhanden = await this.prisma.teamMember.findUnique({
        where: { teamId_memberId: { teamId, memberId: elternMemberId } },
      });
      if (!vorhanden) {
        await this.prisma.teamMember.create({
          data: { teamId, memberId: elternMemberId, rolle: 'ELTERN' },
        });
      }

      // Sportarten des Kindes auf Eltern uebertragen (ohne Duplikate)
      const elternMitglied = await this.prisma.member.findUnique({
        where: { id: elternMemberId },
        select: { sport: true },
      });
      if (elternMitglied) {
        const kindSportarten = kindMitglied?.sport || [];
        const teamSportart = team?.abteilung?.sport;
        const neueSportarten = new Set([...elternMitglied.sport]);
        for (const s of kindSportarten) neueSportarten.add(s);
        if (teamSportart) neueSportarten.add(teamSportart);

        if (neueSportarten.size > elternMitglied.sport.length) {
          await this.prisma.member.update({
            where: { id: elternMemberId },
            data: { sport: Array.from(neueSportarten) },
          });
        }
      }
    }
  }

  /**
   * Wenn ein Kind aus dem Team entfernt wird, pruefen ob Eltern noch andere Kinder
   * im selben Team haben. Falls nicht, werden sie ebenfalls entfernt.
   */
  private async elternAutomatischEntfernen(teamId: string, memberId: string) {
    // Pruefen ob dieses Mitglied ein KIND in einer Familie ist
    const kindEintraege = await this.prisma.familieMitglied.findMany({
      where: {
        memberId,
        rolle: FamilienRolle.KIND,
      },
      select: { familieId: true },
    });

    if (kindEintraege.length === 0) return;

    const familieIds = kindEintraege.map((k) => k.familieId);

    // Alle Elternteile in diesen Familien finden
    const elternEintraege = await this.prisma.familieMitglied.findMany({
      where: {
        familieId: { in: familieIds },
        rolle: { in: [FamilienRolle.MUTTER, FamilienRolle.VATER, FamilienRolle.ERZIEHUNGSBERECHTIGTER] },
      },
      select: { memberId: true, userId: true },
    });

    // Alle anderen Kinder aus diesen Familien (ausser dem gerade entfernten)
    const andereKinder = await this.prisma.familieMitglied.findMany({
      where: {
        familieId: { in: familieIds },
        rolle: FamilienRolle.KIND,
        memberId: { not: memberId },
      },
      select: { memberId: true },
    });

    // Pruefen welche dieser Kinder noch im selben Team sind
    const andereKinderIds = andereKinder
      .map((k) => k.memberId)
      .filter((id): id is string => !!id);

    const kinderNochImTeam = andereKinderIds.length > 0
      ? await this.prisma.teamMember.findMany({
          where: { teamId, memberId: { in: andereKinderIds } },
          select: { memberId: true },
        })
      : [];

    // Falls noch Kinder im Team sind, Eltern nicht entfernen
    if (kinderNochImTeam.length > 0) return;

    // Keine Kinder mehr im Team → Eltern mit Rolle ELTERN entfernen
    for (const eltern of elternEintraege) {
      let elternMemberId = eltern.memberId;
      if (!elternMemberId && eltern.userId) {
        const member = await this.prisma.member.findFirst({
          where: { userId: eltern.userId },
          select: { id: true },
        });
        if (member) elternMemberId = member.id;
      }
      if (!elternMemberId) continue;

      // Nur entfernen wenn die Rolle ELTERN ist (nicht wenn manuell als SPIELER o.ae. hinzugefuegt)
      await this.prisma.teamMember.deleteMany({
        where: { teamId, memberId: elternMemberId, rolle: 'ELTERN' },
      });
    }
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

    // Rolle automatisch aus vereinsRollen ableiten, falls nicht explizit gesetzt
    let rolle = dto.rolle;
    if (!rolle) {
      // vereinsRollen vom User oder Member laden
      let vereinsRollen: string[] = [];
      if (mitglied.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: mitglied.userId },
          select: { vereinsRollen: true },
        });
        if (user?.vereinsRollen?.length) {
          vereinsRollen = user.vereinsRollen;
        }
      }
      if (vereinsRollen.length === 0 && mitglied.vereinsRollen?.length) {
        vereinsRollen = mitglied.vereinsRollen;
      }
      rolle = this.vereinsRolleZuTeamRolle(vereinsRollen);
    }

    const neuesTeamMitglied = await this.prisma.teamMember.create({
      data: {
        teamId,
        memberId: dto.memberId,
        rolle,
      },
      include: { member: true },
    });

    // Eltern automatisch hinzufuegen wenn Kind zum Team hinzugefuegt wird
    await this.elternAutomatischHinzufuegen(teamId, dto.memberId);

    return neuesTeamMitglied;
  }

  async mitgliedEntfernen(tenantId: string, teamId: string, memberId: string) {
    await this.nachIdAbrufen(tenantId, teamId);

    const eintrag = await this.prisma.teamMember.findUnique({
      where: { teamId_memberId: { teamId, memberId } },
    });
    if (!eintrag) {
      throw new NotFoundException('Mitglied ist nicht in diesem Team.');
    }

    // Zuerst Eltern-Automatik pruefen (vor dem Loeschen, damit die Familien-Verknuepfung noch da ist)
    await this.elternAutomatischEntfernen(teamId, memberId);

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
