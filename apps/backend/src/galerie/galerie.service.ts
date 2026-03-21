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
   * Fotos fuer ein Team laden
   */
  async fuerTeamLaden(tenantId: string, teamId: string) {
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
   * Alle Fotos des Vereins laden (gruppiert nach Team/Event)
   */
  async alleLaden(tenantId: string) {
    const fotos = await this.prisma.foto.findMany({
      where: { tenantId },
      include: {
        team: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { erstelltAm: 'desc' },
    });

    return fotos;
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
