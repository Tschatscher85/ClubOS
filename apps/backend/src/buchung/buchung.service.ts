import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ErstelleRessourceDto,
  AktualisiereRessourceDto,
} from './dto/erstelle-ressource.dto';
import { ErstelleBuchungDto } from './dto/erstelle-buchung.dto';

@Injectable()
export class BuchungService {
  constructor(private prisma: PrismaService) {}

  // ==================== Ressourcen ====================

  /** Alle Ressourcen eines Vereins abrufen */
  async alleRessourcenAbrufen(tenantId: string) {
    return this.prisma.ressource.findMany({
      where: { tenantId },
      include: {
        buchungen: {
          where: {
            status: { in: ['BESTAETIGT', 'ANFRAGE'] },
          },
          include: { bucher: { select: { id: true, email: true } } },
          orderBy: { start: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Neue Ressource erstellen (nur Admin) */
  async ressourceErstellen(tenantId: string, dto: ErstelleRessourceDto) {
    return this.prisma.ressource.create({
      data: {
        tenantId,
        name: dto.name,
        typ: dto.typ,
        beschreibung: dto.beschreibung,
        bildUrl: dto.bildUrl,
        maxPersonen: dto.maxPersonen,
      },
    });
  }

  /** Ressource aktualisieren */
  async ressourceAktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisiereRessourceDto,
  ) {
    const ressource = await this.prisma.ressource.findFirst({
      where: { id, tenantId },
    });

    if (!ressource) {
      throw new NotFoundException('Ressource nicht gefunden.');
    }

    return this.prisma.ressource.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.typ !== undefined && { typ: dto.typ }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
        ...(dto.bildUrl !== undefined && { bildUrl: dto.bildUrl }),
        ...(dto.maxPersonen !== undefined && { maxPersonen: dto.maxPersonen }),
        ...(dto.aktiv !== undefined && { aktiv: dto.aktiv }),
      },
    });
  }

  /** Ressource loeschen */
  async ressourceLoeschen(tenantId: string, id: string) {
    const ressource = await this.prisma.ressource.findFirst({
      where: { id, tenantId },
    });

    if (!ressource) {
      throw new NotFoundException('Ressource nicht gefunden.');
    }

    return this.prisma.ressource.delete({ where: { id } });
  }

  // ==================== Buchungen ====================

  /** Buchungen im Zeitraum abrufen */
  async buchungenAbrufen(
    tenantId: string,
    ressourceId?: string,
    start?: string,
    ende?: string,
  ) {
    return this.prisma.buchung.findMany({
      where: {
        tenantId,
        ...(ressourceId && { ressourceId }),
        ...(start && { start: { gte: new Date(start) } }),
        ...(ende && { ende: { lte: new Date(ende) } }),
        status: { in: ['BESTAETIGT', 'ANFRAGE'] },
      },
      include: {
        ressource: true,
        bucher: { select: { id: true, email: true } },
      },
      orderBy: { start: 'asc' },
    });
  }

  /** Neue Buchung erstellen mit Konflikt-Pruefung */
  async buchungErstellen(
    tenantId: string,
    bucherId: string,
    dto: ErstelleBuchungDto,
  ) {
    // Pruefen ob Ressource existiert und zum Verein gehoert
    const ressource = await this.prisma.ressource.findFirst({
      where: { id: dto.ressourceId, tenantId },
    });

    if (!ressource) {
      throw new NotFoundException('Ressource nicht gefunden.');
    }

    if (!ressource.aktiv) {
      throw new ConflictException('Ressource ist derzeit nicht verfuegbar.');
    }

    // KRITISCH: Konflikt-Pruefung
    const konflikt = await this.prisma.buchung.findFirst({
      where: {
        ressourceId: dto.ressourceId,
        status: { in: ['BESTAETIGT', 'ANFRAGE'] },
        start: { lt: new Date(dto.ende) },
        ende: { gt: new Date(dto.start) },
      },
    });

    if (konflikt) {
      throw new ConflictException(
        'Ressource ist in diesem Zeitraum bereits gebucht.',
      );
    }

    return this.prisma.buchung.create({
      data: {
        ressourceId: dto.ressourceId,
        tenantId,
        bucherId,
        titel: dto.titel,
        start: new Date(dto.start),
        ende: new Date(dto.ende),
        notiz: dto.notiz,
      },
      include: {
        ressource: true,
        bucher: { select: { id: true, email: true } },
      },
    });
  }

  /** Buchung stornieren (eigene oder Admin) */
  async buchungStornieren(
    tenantId: string,
    buchungId: string,
    userId: string,
    userRole: string,
  ) {
    const buchung = await this.prisma.buchung.findFirst({
      where: { id: buchungId, tenantId },
    });

    if (!buchung) {
      throw new NotFoundException('Buchung nicht gefunden.');
    }

    // Nur eigene Buchungen oder Admin darf stornieren
    const istAdmin = ['SUPERADMIN', 'ADMIN'].includes(userRole);
    if (buchung.bucherId !== userId && !istAdmin) {
      throw new ForbiddenException(
        'Nur eigene Buchungen oder Admins koennen stornieren.',
      );
    }

    return this.prisma.buchung.update({
      where: { id: buchungId },
      data: { status: 'STORNIERT' },
    });
  }
}
