import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { AushangKategorie } from '@prisma/client';

export interface ErstelleAushangDto {
  titel: string;
  inhalt: string;
  kategorie: AushangKategorie;
  teamId?: string;
  bildUrl?: string;
  ablaufDatum?: string;
}

export interface AktualisiereAushangDto {
  titel?: string;
  inhalt?: string;
  kategorie?: AushangKategorie;
  teamId?: string | null;
  bildUrl?: string | null;
  ablaufDatum?: string | null;
}

@Injectable()
export class AushangService {
  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  /** Neuen Aushang erstellen. Bei AUSFALL: Push an Team senden. */
  async erstellen(tenantId: string, userId: string, dto: ErstelleAushangDto) {
    const aushang = await this.prisma.aushang.create({
      data: {
        tenantId,
        erstelltVon: userId,
        titel: dto.titel,
        inhalt: dto.inhalt,
        kategorie: dto.kategorie,
        teamId: dto.teamId || null,
        bildUrl: dto.bildUrl || null,
        ablaufDatum: dto.ablaufDatum ? new Date(dto.ablaufDatum) : null,
      },
      include: {
        team: { select: { id: true, name: true } },
      },
    });

    // Bei AUSFALL-Kategorie: Push an Team-Mitglieder senden
    if (dto.kategorie === 'AUSFALL' && dto.teamId) {
      try {
        const teamMitglieder = await this.prisma.teamMember.findMany({
          where: { teamId: dto.teamId },
          include: { member: { select: { userId: true } } },
        });

        const userIds = teamMitglieder
          .map((tm) => tm.member.userId)
          .filter((id): id is string => id !== null);

        if (userIds.length > 0) {
          const teamName = aushang.team?.name || 'Team';
          await this.pushService.sendePushAnMehrere(userIds, {
            title: `Ausfall: ${dto.titel}`,
            body: `${teamName} — ${dto.titel}`,
            url: '/schwarzes-brett',
          });
        }
      } catch {
        // Push-Fehler sollen das Erstellen nicht verhindern
      }
    }

    return aushang;
  }

  /**
   * Aushaenge abrufen — MEMBER/PARENT sehen nur Aushaenge ihrer eigenen Teams
   * + Aushaenge ohne Team-Zuordnung (vereinsweite Aushenge).
   * ADMIN/TRAINER/SUPERADMIN sehen alle.
   */
  async alleAbrufen(tenantId: string, userId?: string, rolle?: string) {
    const jetzt = new Date();
    const siebenTageZurueck = new Date(jetzt.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Team-IDs ermitteln fuer MEMBER/PARENT
    let teamFilter: string[] | null = null;
    if (userId && rolle && ['MEMBER', 'PARENT'].includes(rolle)) {
      teamFilter = await this.meineTeamIds(userId, tenantId);
    }

    const zeitFilter = {
      OR: [
        { ablaufDatum: null },
        { ablaufDatum: { gte: siebenTageZurueck } },
      ],
    };

    const ablaufFilter = [
      { ablaufDatum: null },
      { ablaufDatum: { gte: siebenTageZurueck } },
    ];

    if (teamFilter !== null) {
      // MEMBER/PARENT: nur eigene Teams + vereinsweite (teamId = null)
      return this.prisma.aushang.findMany({
        where: {
          tenantId,
          AND: [
            { OR: ablaufFilter },
            { OR: [{ teamId: { in: teamFilter } }, { teamId: null }] },
          ],
        },
        include: {
          team: { select: { id: true, name: true } },
        },
        orderBy: { erstelltAm: 'desc' },
      });
    }

    // ADMIN/TRAINER/SUPERADMIN: alle
    return this.prisma.aushang.findMany({
      where: {
        tenantId,
        OR: ablaufFilter,
      },
      include: {
        team: { select: { id: true, name: true } },
      },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  /** Team-IDs eines Users ermitteln (ueber Member -> TeamMember) */
  private async meineTeamIds(userId: string, tenantId: string): Promise<string[]> {
    const member = await this.prisma.member.findFirst({
      where: { userId, tenantId },
      select: {
        teamMembers: { select: { teamId: true } },
      },
    });

    if (!member) {
      // Fuer PARENT: Kinder-Teams suchen
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          familieMitgliedschaften: {
            select: {
              familie: {
                select: {
                  mitglieder: {
                    select: {
                      member: {
                        select: {
                          teamMembers: { select: { teamId: true } },
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

      const teamIds = new Set<string>();
      user?.familieMitgliedschaften?.forEach((fm) => {
        fm.familie?.mitglieder?.forEach((m) => {
          m.member?.teamMembers?.forEach((tm) => {
            teamIds.add(tm.teamId);
          });
        });
      });
      return Array.from(teamIds);
    }

    return member.teamMembers.map((tm) => tm.teamId);
  }

  /** Oeffentliche Aushaenge fuer Vereinsseite (nur aktive, ohne erstelltVon). */
  async oeffentlichAbrufen(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, logo: true, primaryColor: true },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    const jetzt = new Date();
    const aushaenge = await this.prisma.aushang.findMany({
      where: {
        tenantId: tenant.id,
        OR: [
          { ablaufDatum: null },
          { ablaufDatum: { gte: jetzt } },
        ],
      },
      select: {
        id: true,
        titel: true,
        inhalt: true,
        kategorie: true,
        bildUrl: true,
        ablaufDatum: true,
        erstelltAm: true,
        team: { select: { id: true, name: true } },
      },
      orderBy: { erstelltAm: 'desc' },
    });

    return { verein: tenant, aushaenge };
  }

  /** Aushang aktualisieren (nur Ersteller oder ADMIN). */
  async aktualisieren(
    tenantId: string,
    id: string,
    userId: string,
    rolle: string,
    dto: AktualisiereAushangDto,
  ) {
    const aushang = await this.prisma.aushang.findFirst({
      where: { id, tenantId },
    });

    if (!aushang) {
      throw new NotFoundException('Aushang nicht gefunden.');
    }

    if (aushang.erstelltVon !== userId && !['SUPERADMIN', 'ADMIN'].includes(rolle)) {
      throw new ForbiddenException('Keine Berechtigung zum Bearbeiten.');
    }

    return this.prisma.aushang.update({
      where: { id },
      data: {
        ...(dto.titel !== undefined && { titel: dto.titel }),
        ...(dto.inhalt !== undefined && { inhalt: dto.inhalt }),
        ...(dto.kategorie !== undefined && { kategorie: dto.kategorie }),
        ...(dto.teamId !== undefined && { teamId: dto.teamId || null }),
        ...(dto.bildUrl !== undefined && { bildUrl: dto.bildUrl || null }),
        ...(dto.ablaufDatum !== undefined && {
          ablaufDatum: dto.ablaufDatum ? new Date(dto.ablaufDatum) : null,
        }),
      },
      include: {
        team: { select: { id: true, name: true } },
      },
    });
  }

  /** Aushang loeschen (nur Ersteller oder ADMIN). */
  async loeschen(tenantId: string, id: string, userId: string, rolle: string) {
    const aushang = await this.prisma.aushang.findFirst({
      where: { id, tenantId },
    });

    if (!aushang) {
      throw new NotFoundException('Aushang nicht gefunden.');
    }

    if (aushang.erstelltVon !== userId && !['SUPERADMIN', 'ADMIN'].includes(rolle)) {
      throw new ForbiddenException('Keine Berechtigung zum Loeschen.');
    }

    return this.prisma.aushang.delete({ where: { id } });
  }
}
