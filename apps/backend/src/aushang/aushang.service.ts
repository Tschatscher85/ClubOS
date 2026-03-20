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

  /** Alle Aushaenge eines Vereins abrufen (aktive + kuerzlich abgelaufene). */
  async alleAbrufen(tenantId: string) {
    const jetzt = new Date();
    // Zeige abgelaufene der letzten 7 Tage noch an
    const siebenTageZurueck = new Date(jetzt.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.prisma.aushang.findMany({
      where: {
        tenantId,
        OR: [
          { ablaufDatum: null },
          { ablaufDatum: { gte: siebenTageZurueck } },
        ],
      },
      include: {
        team: { select: { id: true, name: true } },
      },
      orderBy: { erstelltAm: 'desc' },
    });
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
