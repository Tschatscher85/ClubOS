import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ErstelleHalleDto,
  AktualisiereHalleDto,
  ErstelleBelegungDto,
  AktualisiereBelegungDto,
} from './dto/erstelle-halle.dto';

/** Wochentage in der richtigen Reihenfolge fuer den Wochenplan */
const WOCHENTAG_REIHENFOLGE = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];

@Injectable()
export class HalleService {
  constructor(private prisma: PrismaService) {}

  /** Neue Halle erstellen */
  async halleErstellen(tenantId: string, dto: ErstelleHalleDto) {
    return this.prisma.halle.create({
      data: {
        tenantId,
        name: dto.name,
        adresse: dto.adresse,
        kapazitaet: dto.kapazitaet,
        lat: dto.lat,
        lng: dto.lng,
        mapsUrl: dto.mapsUrl,
        parkplatzInfo: dto.parkplatzInfo,
        zugangscode: dto.zugangscode,
        untergruende: dto.untergruende ?? [],
      },
    });
  }

  /** Alle Hallen eines Vereins abrufen */
  async alleHallenAbrufen(tenantId: string) {
    return this.prisma.halle.findMany({
      where: { tenantId },
      include: {
        belegungen: {
          include: { team: true },
          orderBy: { von: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Einzelne Halle abrufen */
  async halleAbrufen(tenantId: string, id: string) {
    const halle = await this.prisma.halle.findFirst({
      where: { id, tenantId },
      include: {
        belegungen: {
          include: { team: true },
          orderBy: { von: 'asc' },
        },
      },
    });

    if (!halle) {
      throw new NotFoundException('Halle nicht gefunden.');
    }

    return halle;
  }

  /** Halle aktualisieren */
  async halleAktualisieren(tenantId: string, id: string, dto: AktualisiereHalleDto) {
    const halle = await this.prisma.halle.findFirst({
      where: { id, tenantId },
    });

    if (!halle) {
      throw new NotFoundException('Halle nicht gefunden.');
    }

    return this.prisma.halle.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.adresse !== undefined && { adresse: dto.adresse }),
        ...(dto.kapazitaet !== undefined && { kapazitaet: dto.kapazitaet }),
        ...(dto.lat !== undefined && { lat: dto.lat }),
        ...(dto.lng !== undefined && { lng: dto.lng }),
        ...(dto.mapsUrl !== undefined && { mapsUrl: dto.mapsUrl }),
        ...(dto.parkplatzInfo !== undefined && { parkplatzInfo: dto.parkplatzInfo }),
        ...(dto.zugangscode !== undefined && { zugangscode: dto.zugangscode }),
        ...(dto.untergruende !== undefined && { untergruende: dto.untergruende }),
      },
    });
  }

  /** Halle loeschen */
  async halleLoeschen(tenantId: string, id: string) {
    const halle = await this.prisma.halle.findFirst({
      where: { id, tenantId },
    });

    if (!halle) {
      throw new NotFoundException('Halle nicht gefunden.');
    }

    return this.prisma.halle.delete({ where: { id } });
  }

  /** Belegung hinzufuegen */
  async belegungHinzufuegen(tenantId: string, halleId: string, dto: ErstelleBelegungDto) {
    // Pruefen ob die Halle zum Verein gehoert
    const halle = await this.prisma.halle.findFirst({
      where: { id: halleId, tenantId },
    });

    if (!halle) {
      throw new NotFoundException('Halle nicht gefunden.');
    }

    // Pruefen ob das Team zum Verein gehoert
    const team = await this.prisma.team.findFirst({
      where: { id: dto.teamId, tenantId },
    });

    if (!team) {
      throw new NotFoundException('Mannschaft nicht gefunden.');
    }

    return this.prisma.hallenbelegung.create({
      data: {
        halleId,
        teamId: dto.teamId,
        wochentag: dto.wochentag,
        von: dto.von,
        bis: dto.bis,
        notiz: dto.notiz,
        wiederholung: dto.wiederholung || 'WOECHENTLICH',
        gueltigVon: dto.gueltigVon ? new Date(dto.gueltigVon) : null,
        gueltigBis: dto.gueltigBis ? new Date(dto.gueltigBis) : null,
        einmalDatum: dto.einmalDatum ? new Date(dto.einmalDatum) : null,
      },
      include: { halle: true, team: true },
    });
  }

  /** Belegung aktualisieren */
  async belegungAktualisieren(tenantId: string, belegungId: string, dto: AktualisiereBelegungDto) {
    const belegung = await this.prisma.hallenbelegung.findFirst({
      where: { id: belegungId },
      include: { halle: true },
    });

    if (!belegung || belegung.halle.tenantId !== tenantId) {
      throw new NotFoundException('Belegung nicht gefunden.');
    }

    return this.prisma.hallenbelegung.update({
      where: { id: belegungId },
      data: {
        ...(dto.teamId !== undefined && { teamId: dto.teamId }),
        ...(dto.wochentag !== undefined && { wochentag: dto.wochentag }),
        ...(dto.von !== undefined && { von: dto.von }),
        ...(dto.bis !== undefined && { bis: dto.bis }),
        ...(dto.notiz !== undefined && { notiz: dto.notiz }),
        ...(dto.halleId !== undefined && { halleId: dto.halleId }),
      },
      include: { halle: true, team: true },
    });
  }

  /** Belegung loeschen */
  async belegungLoeschen(tenantId: string, belegungId: string) {
    const belegung = await this.prisma.hallenbelegung.findFirst({
      where: { id: belegungId },
      include: { halle: true },
    });

    if (!belegung || belegung.halle.tenantId !== tenantId) {
      throw new NotFoundException('Belegung nicht gefunden.');
    }

    return this.prisma.hallenbelegung.delete({ where: { id: belegungId } });
  }

  /**
   * Wochenplan: Alle Belegungen eines Vereins gruppiert nach Wochentag.
   * Gibt ein Objekt zurueck mit den Wochentagen als Schluessel.
   */
  async wochenplan(tenantId: string) {
    const belegungen = await this.prisma.hallenbelegung.findMany({
      where: {
        halle: { tenantId },
      },
      include: {
        halle: true,
        team: true,
      },
      orderBy: { von: 'asc' },
    });

    // Nach Wochentag gruppieren
    const plan: Record<string, typeof belegungen> = {};

    for (const tag of WOCHENTAG_REIHENFOLGE) {
      plan[tag] = belegungen.filter((b) => b.wochentag === tag);
    }

    return plan;
  }
}
