import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FamilienRolle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FamilieService {
  constructor(private prisma: PrismaService) {}

  /** Familie erstellen */
  async erstellen(tenantId: string, name?: string) {
    return this.prisma.familie.create({
      data: {
        tenantId,
        name: name || 'Neue Familie',
      },
      include: {
        mitglieder: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true, memberNumber: true } },
          },
        },
      },
    });
  }

  /** Mitglied zur Familie hinzufuegen (mit Duplikat-Pruefung und Partner-Spiegelung) */
  async mitgliedHinzufuegen(
    familieId: string,
    tenantId: string,
    daten: { memberId?: string; userId?: string; rolle: FamilienRolle },
  ) {
    const familie = await this.prisma.familie.findFirst({
      where: { id: familieId, tenantId },
    });
    if (!familie) {
      throw new NotFoundException('Familie nicht gefunden.');
    }

    // Immer memberId verwenden: userId zu memberId aufloesen
    let resolvedMemberId = daten.memberId || null;
    if (!resolvedMemberId && daten.userId) {
      const member = await this.prisma.member.findFirst({
        where: { userId: daten.userId },
        select: { id: true },
      });
      if (member) {
        resolvedMemberId = member.id;
      } else {
        throw new BadRequestException('Kein Member-Profil fuer diesen Benutzer gefunden.');
      }
    }

    if (!resolvedMemberId) {
      throw new BadRequestException('memberId oder userId muss angegeben werden.');
    }

    // Duplikat-Pruefung: Ist dieses Mitglied schon in der Familie?
    const bereitsVorhanden = await this.prisma.familieMitglied.findFirst({
      where: {
        familieId,
        memberId: resolvedMemberId,
      },
    });
    if (bereitsVorhanden) {
      throw new BadRequestException('Dieses Mitglied ist bereits in dieser Familie.');
    }

    const neuesMitglied = await this.prisma.familieMitglied.create({
      data: {
        familieId,
        memberId: resolvedMemberId,
        userId: null,
        rolle: daten.rolle,
      },
      include: {
        member: { select: { id: true, firstName: true, lastName: true, memberNumber: true } },
      },
    });

    // Partner-Spiegelung: Wenn ein Elternteil/Partner hinzugefuegt wird,
    // pruefe ob das Mitglied in einer anderen Familie Kinder hat und uebernehme diese.
    if (
      ([FamilienRolle.PARTNER, FamilienRolle.MUTTER, FamilienRolle.VATER, FamilienRolle.ERZIEHUNGSBERECHTIGTER] as FamilienRolle[]).includes(daten.rolle)
    ) {
      const andereElternMitgliedschaften = await this.prisma.familieMitglied.findMany({
        where: {
          memberId: resolvedMemberId,
          familieId: { not: familieId },
          rolle: { in: [FamilienRolle.MUTTER, FamilienRolle.VATER, FamilienRolle.PARTNER, FamilienRolle.ERZIEHUNGSBERECHTIGTER] },
        },
        include: {
          familie: {
            include: {
              mitglieder: {
                where: { rolle: FamilienRolle.KIND },
              },
            },
          },
        },
      });

      // Kinder aus anderen Familien uebernehmen
      for (const mitgliedschaft of andereElternMitgliedschaften) {
        for (const kind of mitgliedschaft.familie.mitglieder) {
          if (kind.memberId) {
            const kindSchonDrin = await this.prisma.familieMitglied.findFirst({
              where: { familieId, memberId: kind.memberId },
            });
            if (!kindSchonDrin) {
              await this.prisma.familieMitglied.create({
                data: {
                  familieId,
                  memberId: kind.memberId,
                  userId: null,
                  rolle: FamilienRolle.KIND,
                },
              });
            }
          }
        }
      }
    }

    // Auto-Name: Wenn Familie noch "Neue Familie" heisst, nach erstem Mitglied benennen
    if (familie.name === 'Neue Familie') {
      const member = await this.prisma.member.findUnique({
        where: { id: resolvedMemberId },
        select: { lastName: true },
      });
      if (member) {
        await this.prisma.familie.update({
          where: { id: familieId },
          data: { name: `Familie ${member.lastName}` },
        });
      }
    }

    return neuesMitglied;
  }

  /** Mitglied aus Familie entfernen */
  async mitgliedEntfernen(familieId: string, familieMitgliedId: string, tenantId: string) {
    const familie = await this.prisma.familie.findFirst({
      where: { id: familieId, tenantId },
    });
    if (!familie) {
      throw new NotFoundException('Familie nicht gefunden.');
    }

    const mitglied = await this.prisma.familieMitglied.findFirst({
      where: { id: familieMitgliedId, familieId },
    });
    if (!mitglied) {
      throw new NotFoundException('Familienmitglied nicht gefunden.');
    }

    return this.prisma.familieMitglied.delete({
      where: { id: familieMitgliedId },
    });
  }

  /** Alle Familien eines Vereins abrufen */
  async alleAbrufen(tenantId: string) {
    return this.prisma.familie.findMany({
      where: { tenantId },
      include: {
        mitglieder: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true, memberNumber: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Familie-Detail abrufen */
  async detailAbrufen(id: string, tenantId: string) {
    const familie = await this.prisma.familie.findFirst({
      where: { id, tenantId },
      include: {
        mitglieder: {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                memberNumber: true,
                email: true,
                birthDate: true,
                teamMembers: {
                  include: {
                    team: { select: { id: true, name: true, ageGroup: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!familie) {
      throw new NotFoundException('Familie nicht gefunden.');
    }

    return familie;
  }

  /** Familie loeschen */
  async loeschen(id: string, tenantId: string) {
    const familie = await this.prisma.familie.findFirst({
      where: { id, tenantId },
    });
    if (!familie) {
      throw new NotFoundException('Familie nicht gefunden.');
    }

    return this.prisma.familie.delete({ where: { id } });
  }

  /** Meine Familie finden (fuer eingeloggten User) */
  async meineFamilie(userId: string, tenantId: string) {
    // Erst Member-Profil des Users finden, dann ueber memberId suchen
    const member = await this.prisma.member.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!member) {
      return null;
    }

    const familieMitgliedschaft = await this.prisma.familieMitglied.findFirst({
      where: { memberId: member.id },
      include: {
        familie: {
          include: {
            mitglieder: {
              include: {
                member: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    memberNumber: true,
                    email: true,
                    birthDate: true,
                    teamMembers: {
                      include: {
                        team: { select: { id: true, name: true, ageGroup: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!familieMitgliedschaft) {
      return null;
    }

    // Sicherstellen, dass die Familie zum selben Tenant gehoert
    if (familieMitgliedschaft.familie.tenantId !== tenantId) {
      return null;
    }

    return familieMitgliedschaft.familie;
  }

  /** Kinder-IDs eines Elternteils finden (fuer Umfragen-Filterung etc.) */
  async kinderVonEltern(userId: string, tenantId: string): Promise<string[]> {
    const elternRollen: FamilienRolle[] = [
      FamilienRolle.MUTTER,
      FamilienRolle.VATER,
      FamilienRolle.ERZIEHUNGSBERECHTIGTER,
      FamilienRolle.PARTNER,
    ];

    // userId zu memberId aufloesen
    const member = await this.prisma.member.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!member) {
      return [];
    }

    // Finde Familie(n) wo das Mitglied Elternteil ist
    const familienMitgliedschaften = await this.prisma.familieMitglied.findMany({
      where: {
        memberId: member.id,
        rolle: { in: elternRollen },
      },
      select: { familieId: true },
    });

    if (familienMitgliedschaften.length === 0) {
      return [];
    }

    const familieIds = familienMitgliedschaften.map((fm) => fm.familieId);

    // Finde alle Kinder in diesen Familien
    const kinder = await this.prisma.familieMitglied.findMany({
      where: {
        familieId: { in: familieIds },
        rolle: FamilienRolle.KIND,
        memberId: { not: null },
      },
      include: {
        member: { select: { tenantId: true } },
      },
    });

    // Nur Kinder aus dem selben Verein
    return kinder
      .filter((k) => k.member?.tenantId === tenantId)
      .map((k) => k.memberId!)
      .filter((id): id is string => !!id);
  }
}
