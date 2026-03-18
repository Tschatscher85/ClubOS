import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ErstelleAbteilungDto,
  AktualisiereAbteilungDto,
} from './dto/erstelle-abteilung.dto';

@Injectable()
export class AbteilungService {
  constructor(private prisma: PrismaService) {}

  async erstellen(tenantId: string, dto: ErstelleAbteilungDto) {
    // Pruefen ob Abteilung fuer diese Sportart schon existiert
    const bestehend = await this.prisma.abteilung.findUnique({
      where: {
        tenantId_sport: { tenantId, sport: dto.sport },
      },
    });

    if (bestehend) {
      throw new ConflictException(
        `Eine Abteilung fuer ${dto.sport} existiert bereits.`,
      );
    }

    return this.prisma.abteilung.create({
      data: {
        tenantId,
        name: dto.name,
        sport: dto.sport,
        leiterIds: dto.leiterIds || [],
        beschreibung: dto.beschreibung,
      },
      include: {
        teams: {
          select: { id: true, name: true, ageGroup: true },
        },
      },
    });
  }

  async alleAbrufen(tenantId: string) {
    return this.prisma.abteilung.findMany({
      where: { tenantId },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
            ageGroup: true,
            _count: { select: { teamMembers: true, events: true } },
          },
        },
        _count: { select: { teams: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async nachIdAbrufen(tenantId: string, id: string) {
    const abteilung = await this.prisma.abteilung.findFirst({
      where: { id, tenantId },
      include: {
        teams: {
          include: {
            teamMembers: {
              include: {
                member: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    memberNumber: true,
                    status: true,
                  },
                },
              },
            },
            _count: { select: { events: true, teamMembers: true } },
          },
        },
      },
    });

    if (!abteilung) {
      throw new NotFoundException('Abteilung nicht gefunden.');
    }

    return abteilung;
  }

  async aktualisieren(tenantId: string, id: string, dto: AktualisiereAbteilungDto) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.abteilung.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.leiterIds !== undefined && { leiterIds: dto.leiterIds }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
      },
      include: {
        teams: {
          select: { id: true, name: true, ageGroup: true },
        },
      },
    });
  }

  async loeschen(tenantId: string, id: string) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.abteilung.delete({ where: { id } });
  }

  /**
   * Bericht fuer eine Abteilung: Mitglieder, Teams, Veranstaltungen
   */
  async bericht(tenantId: string, id: string) {
    const abteilung = await this.prisma.abteilung.findFirst({
      where: { id, tenantId },
      include: {
        teams: {
          include: {
            teamMembers: {
              include: {
                member: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    birthDate: true,
                    status: true,
                    sport: true,
                  },
                },
              },
            },
            events: {
              where: {
                date: { gte: new Date(new Date().getFullYear(), 0, 1) },
              },
              select: { id: true, type: true, date: true },
            },
            _count: { select: { teamMembers: true, events: true } },
          },
        },
      },
    });

    if (!abteilung) {
      throw new NotFoundException('Abteilung nicht gefunden.');
    }

    // Statistik berechnen
    let gesamtMitglieder = 0;
    let gesamtEvents = 0;
    const teamBerichte = abteilung.teams.map((team) => {
      gesamtMitglieder += team._count.teamMembers;
      gesamtEvents += team._count.events;

      return {
        id: team.id,
        name: team.name,
        altersgruppe: team.ageGroup,
        anzahlMitglieder: team._count.teamMembers,
        anzahlVeranstaltungen: team._count.events,
        mitglieder: team.teamMembers.map((tm) => ({
          id: tm.member.id,
          name: `${tm.member.firstName} ${tm.member.lastName}`,
          geburtsdatum: tm.member.birthDate,
          status: tm.member.status,
          rolle: tm.rolle,
        })),
      };
    });

    return {
      abteilung: {
        id: abteilung.id,
        name: abteilung.name,
        sport: abteilung.sport,
      },
      zusammenfassung: {
        anzahlTeams: abteilung.teams.length,
        gesamtMitglieder,
        gesamtVeranstaltungen: gesamtEvents,
      },
      teams: teamBerichte,
    };
  }
}
