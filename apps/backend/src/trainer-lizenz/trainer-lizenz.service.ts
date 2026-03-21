import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ErstelleLizenzDto {
  userId?: string;
  bezeichnung: string;
  ausstellerVerband?: string;
  lizenznummer?: string;
  erhaltenAm: string; // ISO date
  gueltigBis?: string; // ISO date oder null
  dokumentUrl?: string;
  notizen?: string;
}

export interface AktualisiereLizenzDto {
  bezeichnung?: string;
  ausstellerVerband?: string;
  lizenznummer?: string;
  erhaltenAm?: string;
  gueltigBis?: string | null;
  dokumentUrl?: string;
  notizen?: string;
}

export interface LizenzMitStatus {
  id: string;
  bezeichnung: string;
  ausstellerVerband: string | null;
  lizenznummer: string | null;
  erhaltenAm: Date;
  gueltigBis: Date | null;
  dokumentUrl: string | null;
  notizen: string | null;
  erstelltAm: Date;
  status: 'GUELTIG' | 'LAEUFT_BALD_AB' | 'ABGELAUFEN';
}

@Injectable()
export class TrainerLizenzService {
  constructor(private prisma: PrismaService) {}

  async erstellen(
    tenantId: string,
    erstellerUserId: string,
    erstellerRolle: string,
    dto: ErstelleLizenzDto,
  ) {
    // Trainer darf nur fuer sich selbst, Admin fuer alle
    const zielUserId = dto.userId || erstellerUserId;

    if (
      zielUserId !== erstellerUserId &&
      !['SUPERADMIN', 'ADMIN'].includes(erstellerRolle)
    ) {
      throw new ForbiddenException(
        'Trainer koennen nur eigene Lizenzen anlegen.',
      );
    }

    // Pruefen ob User zum Tenant gehoert
    const user = await this.prisma.user.findFirst({
      where: { id: zielUserId, tenantId },
    });
    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }

    return this.prisma.trainerLizenz.create({
      data: {
        tenantId,
        userId: zielUserId,
        bezeichnung: dto.bezeichnung,
        ausstellerVerband: dto.ausstellerVerband || null,
        lizenznummer: dto.lizenznummer || null,
        erhaltenAm: new Date(dto.erhaltenAm),
        gueltigBis: dto.gueltigBis ? new Date(dto.gueltigBis) : null,
        dokumentUrl: dto.dokumentUrl || null,
        notizen: dto.notizen || null,
      },
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
    });
  }

  async auflisten(tenantId: string, userId: string, rolle: string) {
    const where: Record<string, unknown> = { tenantId };

    // Nicht-Admins sehen nur ihre eigenen
    if (!['SUPERADMIN', 'ADMIN'].includes(rolle)) {
      where['userId'] = userId;
    }

    const lizenzen = await this.prisma.trainerLizenz.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ gueltigBis: 'asc' }, { erstelltAm: 'desc' }],
    });

    return lizenzen.map((l) => ({
      ...l,
      status: this.berechneStatus(l.gueltigBis),
    }));
  }

  async uebersicht(tenantId: string) {
    // Alle Trainer/Admins mit ihren Lizenzen
    const trainer = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ['ADMIN', 'TRAINER'] },
        istAktiv: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        profile: { select: { firstName: true, lastName: true } },
        trainerLizenzen: {
          orderBy: { gueltigBis: 'asc' },
        },
      },
    });

    const jetzt = new Date();
    const in3Monaten = new Date(jetzt);
    in3Monaten.setMonth(in3Monaten.getMonth() + 3);

    return trainer.map((t) => {
      const lizenzenMitStatus: LizenzMitStatus[] = t.trainerLizenzen.map((l) => ({
        id: l.id,
        bezeichnung: l.bezeichnung,
        ausstellerVerband: l.ausstellerVerband,
        lizenznummer: l.lizenznummer,
        erhaltenAm: l.erhaltenAm,
        gueltigBis: l.gueltigBis,
        dokumentUrl: l.dokumentUrl,
        notizen: l.notizen,
        erstelltAm: l.erstelltAm,
        status: this.berechneStatus(l.gueltigBis),
      }));

      const hatAbgelaufene = lizenzenMitStatus.some((l) => l.status === 'ABGELAUFEN');
      const hatBaldAblaufend = lizenzenMitStatus.some(
        (l) => l.status === 'LAEUFT_BALD_AB',
      );

      return {
        id: t.id,
        email: t.email,
        rolle: t.role,
        name: t.profile
          ? `${t.profile.firstName} ${t.profile.lastName}`
          : t.email,
        lizenzen: lizenzenMitStatus,
        hatAbgelaufene,
        hatBaldAblaufend,
      };
    });
  }

  async aktualisieren(
    tenantId: string,
    lizenzId: string,
    userId: string,
    rolle: string,
    dto: AktualisiereLizenzDto,
  ) {
    const lizenz = await this.prisma.trainerLizenz.findFirst({
      where: { id: lizenzId, tenantId },
    });

    if (!lizenz) {
      throw new NotFoundException('Lizenz nicht gefunden.');
    }

    // Trainer darf nur eigene aktualisieren
    if (lizenz.userId !== userId && !['SUPERADMIN', 'ADMIN'].includes(rolle)) {
      throw new ForbiddenException(
        'Keine Berechtigung, diese Lizenz zu bearbeiten.',
      );
    }

    const updateData: Record<string, unknown> = {};
    if (dto.bezeichnung !== undefined) updateData['bezeichnung'] = dto.bezeichnung;
    if (dto.ausstellerVerband !== undefined)
      updateData['ausstellerVerband'] = dto.ausstellerVerband || null;
    if (dto.lizenznummer !== undefined)
      updateData['lizenznummer'] = dto.lizenznummer || null;
    if (dto.erhaltenAm !== undefined)
      updateData['erhaltenAm'] = new Date(dto.erhaltenAm);
    if (dto.gueltigBis !== undefined)
      updateData['gueltigBis'] = dto.gueltigBis ? new Date(dto.gueltigBis) : null;
    if (dto.dokumentUrl !== undefined)
      updateData['dokumentUrl'] = dto.dokumentUrl || null;
    if (dto.notizen !== undefined) updateData['notizen'] = dto.notizen || null;

    return this.prisma.trainerLizenz.update({
      where: { id: lizenzId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async loeschen(
    tenantId: string,
    lizenzId: string,
    userId: string,
    rolle: string,
  ) {
    const lizenz = await this.prisma.trainerLizenz.findFirst({
      where: { id: lizenzId, tenantId },
    });

    if (!lizenz) {
      throw new NotFoundException('Lizenz nicht gefunden.');
    }

    if (lizenz.userId !== userId && !['SUPERADMIN', 'ADMIN'].includes(rolle)) {
      throw new ForbiddenException(
        'Keine Berechtigung, diese Lizenz zu loeschen.',
      );
    }

    await this.prisma.trainerLizenz.delete({ where: { id: lizenzId } });
  }

  async ablaufend(tenantId: string) {
    const jetzt = new Date();
    const in3Monaten = new Date(jetzt);
    in3Monaten.setMonth(in3Monaten.getMonth() + 3);

    const lizenzen = await this.prisma.trainerLizenz.findMany({
      where: {
        tenantId,
        gueltigBis: {
          lte: in3Monaten,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { gueltigBis: 'asc' },
    });

    return lizenzen.map((l) => ({
      ...l,
      status: this.berechneStatus(l.gueltigBis),
    }));
  }

  private berechneStatus(
    gueltigBis: Date | null,
  ): 'GUELTIG' | 'LAEUFT_BALD_AB' | 'ABGELAUFEN' {
    if (!gueltigBis) return 'GUELTIG'; // Unbefristet

    const jetzt = new Date();
    const in3Monaten = new Date(jetzt);
    in3Monaten.setMonth(in3Monaten.getMonth() + 3);

    if (gueltigBis < jetzt) return 'ABGELAUFEN';
    if (gueltigBis <= in3Monaten) return 'LAEUFT_BALD_AB';
    return 'GUELTIG';
  }
}
