import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GalerieService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Foto hochladen und speichern
   */
  async fotoHochladen(
    tenantId: string,
    userId: string,
    dateiname: string,
    teamId?: string,
    eventId?: string,
    beschreibung?: string,
  ) {
    const url = `/uploads/galerie/${dateiname}`;

    const foto = await this.prisma.foto.create({
      data: {
        tenantId,
        teamId: teamId || null,
        eventId: eventId || null,
        url,
        beschreibung: beschreibung || null,
        hochgeladenVon: userId,
      },
    });

    return foto;
  }

  /**
   * Fotos fuer ein Team laden — DSGVO: Teamzugehoerigkeit pruefen
   */
  async fuerTeamLaden(tenantId: string, teamId: string, userId?: string, rolle?: string) {
    const istAdmin = rolle && ['ADMIN', 'SUPERADMIN'].includes(rolle);

    if (!istAdmin && userId) {
      const teamIds = await this.meineTeamIds(userId, tenantId);
      if (!teamIds.includes(teamId)) {
        throw new ForbiddenException('Du hast keinen Zugriff auf Fotos dieses Teams.');
      }
    }

    return this.prisma.foto.findMany({
      where: { tenantId, teamId },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  /**
   * Fotos fuer ein Event laden
   */
  async fuerEventLaden(tenantId: string, eventId: string) {
    return this.prisma.foto.findMany({
      where: { tenantId, eventId },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  /**
   * Team-IDs ermitteln, in denen der User Mitglied ist
   */
  private async meineTeamIds(userId: string, tenantId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        profile: {
          select: {
            teamMembers: {
              select: { teamId: true },
            },
          },
        },
      },
    });

    return user?.profile?.teamMembers?.map((tm) => tm.teamId) ?? [];
  }

  /**
   * Alle Fotos laden — DSGVO-konform nach Rolle gefiltert:
   * ADMIN/SUPERADMIN: alle Fotos
   * TRAINER/MEMBER/PARENT: nur Fotos der eigenen Teams
   */
  async alleLaden(tenantId: string, userId: string, rolle: string) {
    const istAdmin = ['ADMIN', 'SUPERADMIN'].includes(rolle);

    if (istAdmin) {
      return this.prisma.foto.findMany({
        where: { tenantId },
        include: {
          team: { select: { id: true, name: true } },
          event: { select: { id: true, title: true } },
        },
        orderBy: { erstelltAm: 'desc' },
      });
    }

    // TRAINER/MEMBER/PARENT: nur Fotos der eigenen Teams
    const teamIds = await this.meineTeamIds(userId, tenantId);

    return this.prisma.foto.findMany({
      where: {
        tenantId,
        OR: [
          { teamId: { in: teamIds } },
          // Eigene Uploads ohne Team-Zuordnung auch anzeigen
          { hochgeladenVon: userId, teamId: null },
        ],
      },
      include: {
        team: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  /**
   * Foto loeschen (nur Uploader oder ADMIN)
   */
  async loeschen(tenantId: string, fotoId: string, userId: string, rolle: string) {
    const foto = await this.prisma.foto.findFirst({
      where: { id: fotoId, tenantId },
    });

    if (!foto) {
      throw new NotFoundException('Foto nicht gefunden.');
    }

    const istAdmin = ['ADMIN', 'SUPERADMIN'].includes(rolle);
    if (foto.hochgeladenVon !== userId && !istAdmin) {
      throw new ForbiddenException('Nur der Hochlader oder ein Admin kann dieses Foto loeschen.');
    }

    await this.prisma.foto.delete({ where: { id: fotoId } });
    return { nachricht: 'Foto geloescht.' };
  }
}
