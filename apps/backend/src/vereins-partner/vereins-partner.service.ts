import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerKategorie, AuftragStatus } from '@prisma/client';

@Injectable()
export class VereinsPartnerService {
  constructor(private prisma: PrismaService) {}

  /** Neuen Vereins-Partner erstellen */
  async erstellen(
    tenantId: string,
    dto: {
      name: string;
      logoUrl?: string;
      webseite?: string;
      beschreibung?: string;
      kategorie: string;
      kontaktName?: string;
      kontaktEmail?: string;
      kontaktTelefon?: string;
      notizen?: string;
    },
  ) {
    return this.prisma.vereinsPartner.create({
      data: {
        tenantId,
        name: dto.name,
        logoUrl: dto.logoUrl,
        webseite: dto.webseite,
        beschreibung: dto.beschreibung,
        kategorie: dto.kategorie as PartnerKategorie,
        kontaktName: dto.kontaktName,
        kontaktEmail: dto.kontaktEmail,
        kontaktTelefon: dto.kontaktTelefon,
        notizen: dto.notizen,
      },
    });
  }

  /** Alle Partner eines Vereins laden (optional nach Kategorie filtern) */
  async alleLaden(tenantId: string, kategorie?: string) {
    return this.prisma.vereinsPartner.findMany({
      where: {
        tenantId,
        ...(kategorie ? { kategorie: kategorie as PartnerKategorie } : {}),
      },
      include: {
        _count: {
          select: { auftraege: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Einzelnen Partner mit Auftraegen laden */
  async nachIdLaden(tenantId: string, id: string) {
    const partner = await this.prisma.vereinsPartner.findFirst({
      where: { id, tenantId },
      include: {
        auftraege: {
          orderBy: { erstelltAm: 'desc' },
        },
      },
    });

    if (!partner) {
      throw new NotFoundException('Partner nicht gefunden.');
    }

    return partner;
  }

  /** Partner aktualisieren */
  async aktualisieren(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      logoUrl?: string;
      webseite?: string;
      beschreibung?: string;
      kategorie?: string;
      kontaktName?: string;
      kontaktEmail?: string;
      kontaktTelefon?: string;
      notizen?: string;
      istAktiv?: boolean;
    },
  ) {
    const partner = await this.prisma.vereinsPartner.findFirst({
      where: { id, tenantId },
    });

    if (!partner) {
      throw new NotFoundException('Partner nicht gefunden.');
    }

    return this.prisma.vereinsPartner.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.webseite !== undefined && { webseite: dto.webseite }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
        ...(dto.kategorie !== undefined && { kategorie: dto.kategorie as PartnerKategorie }),
        ...(dto.kontaktName !== undefined && { kontaktName: dto.kontaktName }),
        ...(dto.kontaktEmail !== undefined && { kontaktEmail: dto.kontaktEmail }),
        ...(dto.kontaktTelefon !== undefined && { kontaktTelefon: dto.kontaktTelefon }),
        ...(dto.notizen !== undefined && { notizen: dto.notizen }),
        ...(dto.istAktiv !== undefined && { istAktiv: dto.istAktiv }),
      },
    });
  }

  /** Partner loeschen */
  async loeschen(tenantId: string, id: string) {
    const partner = await this.prisma.vereinsPartner.findFirst({
      where: { id, tenantId },
    });

    if (!partner) {
      throw new NotFoundException('Partner nicht gefunden.');
    }

    return this.prisma.vereinsPartner.delete({ where: { id } });
  }

  /** Neuen Auftrag fuer einen Partner erstellen */
  async auftragErstellen(
    tenantId: string,
    partnerId: string,
    userId: string,
    dto: {
      beschreibung: string;
      betrag?: number;
      datum?: string;
      teamId?: string;
    },
  ) {
    const partner = await this.prisma.vereinsPartner.findFirst({
      where: { id: partnerId, tenantId },
    });

    if (!partner) {
      throw new NotFoundException('Partner nicht gefunden.');
    }

    return this.prisma.vereinsPartnerAuftrag.create({
      data: {
        tenantId,
        partnerId,
        erstelltVon: userId,
        beschreibung: dto.beschreibung,
        betrag: dto.betrag,
        datum: dto.datum ? new Date(dto.datum) : undefined,
        teamId: dto.teamId,
      },
    });
  }

  /** Alle Auftraege eines Partners laden */
  async auftraegeLaden(tenantId: string, partnerId: string) {
    return this.prisma.vereinsPartnerAuftrag.findMany({
      where: {
        tenantId,
        partnerId,
      },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  /** Auftragsstatus aktualisieren */
  async auftragAktualisieren(
    tenantId: string,
    auftragId: string,
    dto: {
      status?: string;
      beschreibung?: string;
      betrag?: number;
    },
  ) {
    const auftrag = await this.prisma.vereinsPartnerAuftrag.findFirst({
      where: { id: auftragId, tenantId },
    });

    if (!auftrag) {
      throw new NotFoundException('Auftrag nicht gefunden.');
    }

    return this.prisma.vereinsPartnerAuftrag.update({
      where: { id: auftragId },
      data: {
        ...(dto.status !== undefined && { status: dto.status as AuftragStatus }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
        ...(dto.betrag !== undefined && { betrag: dto.betrag }),
      },
    });
  }
}
