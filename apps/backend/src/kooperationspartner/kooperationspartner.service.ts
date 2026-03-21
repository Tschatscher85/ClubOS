import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerKategorie } from '@prisma/client';

@Injectable()
export class KooperationspartnerService {
  constructor(private prisma: PrismaService) {}

  /** Neuen Kooperationspartner erstellen */
  async erstellen(dto: {
    name: string;
    logoUrl?: string;
    webseite?: string;
    beschreibung?: string;
    kategorie: PartnerKategorie;
    kontaktEmail?: string;
    kontaktTelefon?: string;
    provisionProzent?: number;
    rabattProzent?: number;
    rabattCode?: string;
    prioritaet?: number;
  }) {
    return this.prisma.kooperationspartner.create({
      data: {
        name: dto.name,
        logoUrl: dto.logoUrl,
        webseite: dto.webseite,
        beschreibung: dto.beschreibung,
        kategorie: dto.kategorie,
        kontaktEmail: dto.kontaktEmail,
        kontaktTelefon: dto.kontaktTelefon,
        provisionProzent: dto.provisionProzent,
        rabattProzent: dto.rabattProzent,
        rabattCode: dto.rabattCode,
        prioritaet: dto.prioritaet ?? 0,
      },
    });
  }

  /** Alle aktiven Kooperationspartner laden, optional nach Kategorie gefiltert */
  async alleLaden(kategorie?: PartnerKategorie) {
    return this.prisma.kooperationspartner.findMany({
      where: {
        istAktiv: true,
        ...(kategorie ? { kategorie } : {}),
      },
      orderBy: { prioritaet: 'desc' },
    });
  }

  /** Kooperationspartner aktualisieren */
  async aktualisieren(
    id: string,
    dto: {
      name?: string;
      logoUrl?: string;
      webseite?: string;
      beschreibung?: string;
      kategorie?: PartnerKategorie;
      kontaktEmail?: string;
      kontaktTelefon?: string;
      provisionProzent?: number;
      rabattProzent?: number;
      rabattCode?: string;
      istAktiv?: boolean;
      prioritaet?: number;
    },
  ) {
    const partner = await this.prisma.kooperationspartner.findUnique({
      where: { id },
    });

    if (!partner) {
      throw new NotFoundException('Kooperationspartner nicht gefunden.');
    }

    return this.prisma.kooperationspartner.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.webseite !== undefined && { webseite: dto.webseite }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
        ...(dto.kategorie !== undefined && { kategorie: dto.kategorie }),
        ...(dto.kontaktEmail !== undefined && { kontaktEmail: dto.kontaktEmail }),
        ...(dto.kontaktTelefon !== undefined && { kontaktTelefon: dto.kontaktTelefon }),
        ...(dto.provisionProzent !== undefined && { provisionProzent: dto.provisionProzent }),
        ...(dto.rabattProzent !== undefined && { rabattProzent: dto.rabattProzent }),
        ...(dto.rabattCode !== undefined && { rabattCode: dto.rabattCode }),
        ...(dto.istAktiv !== undefined && { istAktiv: dto.istAktiv }),
        ...(dto.prioritaet !== undefined && { prioritaet: dto.prioritaet }),
      },
    });
  }

  /** Kooperationspartner loeschen */
  async loeschen(id: string) {
    const partner = await this.prisma.kooperationspartner.findUnique({
      where: { id },
    });

    if (!partner) {
      throw new NotFoundException('Kooperationspartner nicht gefunden.');
    }

    return this.prisma.kooperationspartner.delete({ where: { id } });
  }
}
