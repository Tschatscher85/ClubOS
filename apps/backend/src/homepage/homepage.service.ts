import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HomepageService {
  constructor(private prisma: PrismaService) {}

  /**
   * Homepage fuer einen Verein erstellen oder abrufen
   */
  async erstellen(tenantId: string) {
    const bestehend = await this.prisma.homepage.findUnique({
      where: { tenantId },
      include: { sektionen: { orderBy: { reihenfolge: 'asc' } } },
    });

    if (bestehend) return bestehend;

    // Vereinsdaten laden fuer automatische Befuellung
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const mitgliederAnzahl = await this.prisma.member.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    return this.prisma.homepage.create({
      data: {
        tenantId,
        subdomain: tenant?.slug || undefined,
        heroTitel: `Willkommen beim ${tenant?.name || 'Verein'}`,
        heroUntertitel: 'Ihr Sportverein - Gemeinsam stark!',
        mitgliederAnzahl,
        sektionen: {
          create: [
            { typ: 'HERO', titel: tenant?.name, reihenfolge: 0 },
            { typ: 'UEBER_UNS', titel: 'Ueber uns', reihenfolge: 1 },
            { typ: 'ABTEILUNGEN', titel: 'Unsere Abteilungen', reihenfolge: 2 },
            { typ: 'MANNSCHAFTEN', titel: 'Unsere Mannschaften', reihenfolge: 3 },
            { typ: 'TERMINE', titel: 'Naechste Termine', reihenfolge: 4 },
            { typ: 'MITGLIED_WERDEN', titel: 'Mitglied werden', reihenfolge: 5 },
            { typ: 'SPONSOREN', titel: 'Unsere Sponsoren', reihenfolge: 6 },
            { typ: 'KONTAKT', titel: 'Kontakt', reihenfolge: 7 },
          ],
        },
      },
      include: { sektionen: { orderBy: { reihenfolge: 'asc' } } },
    });
  }

  /**
   * Homepage eines Vereins abrufen (Admin)
   */
  async abrufen(tenantId: string) {
    const homepage = await this.prisma.homepage.findUnique({
      where: { tenantId },
      include: {
        sektionen: { orderBy: { reihenfolge: 'asc' } },
        tenant: true,
      },
    });

    if (!homepage) {
      return this.erstellen(tenantId);
    }

    return homepage;
  }

  /**
   * Homepage aktualisieren
   */
  async aktualisieren(
    tenantId: string,
    daten: {
      istAktiv?: boolean;
      heroTitel?: string;
      heroUntertitel?: string;
      heroBildUrl?: string;
      ueberUns?: string;
      gruendungsjahr?: number;
      kontaktEmail?: string;
      kontaktTelefon?: string;
      kontaktAdresse?: string;
      oeffnungszeiten?: string;
      impressum?: string;
      datenschutz?: string;
      socialFacebook?: string;
      socialInstagram?: string;
      socialYoutube?: string;
      seoTitel?: string;
      seoBeschreibung?: string;
      footerText?: string;
      customCss?: string;
    },
  ) {
    // Mitgliederzahl automatisch aktualisieren
    const mitgliederAnzahl = await this.prisma.member.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    return this.prisma.homepage.update({
      where: { tenantId },
      data: { ...daten, mitgliederAnzahl },
      include: { sektionen: { orderBy: { reihenfolge: 'asc' } } },
    });
  }

  /**
   * Sektion hinzufuegen
   */
  async sektionHinzufuegen(
    homepageId: string,
    daten: {
      typ: string;
      titel?: string;
      inhalt?: string;
      bildUrl?: string;
      reihenfolge?: number;
    },
  ) {
    return this.prisma.homepageSektion.create({
      data: {
        homepageId,
        typ: daten.typ as 'HERO' | 'UEBER_UNS' | 'ABTEILUNGEN' | 'MANNSCHAFTEN' | 'TERMINE' | 'NEUIGKEITEN' | 'KONTAKT' | 'SPONSOREN' | 'GALERIE' | 'MITGLIED_WERDEN' | 'FREITEXT' | 'TURNIER',
        titel: daten.titel,
        inhalt: daten.inhalt,
        bildUrl: daten.bildUrl,
        reihenfolge: daten.reihenfolge ?? 0,
      },
    });
  }

  /**
   * Sektion aktualisieren
   */
  async sektionAktualisieren(
    sektionId: string,
    daten: {
      titel?: string;
      inhalt?: string;
      bildUrl?: string;
      reihenfolge?: number;
      istSichtbar?: boolean;
    },
  ) {
    const { titel, inhalt, bildUrl, reihenfolge, istSichtbar } = daten;
    return this.prisma.homepageSektion.update({
      where: { id: sektionId },
      data: { titel, inhalt, bildUrl, reihenfolge, istSichtbar },
    });
  }

  /**
   * Sektion loeschen
   */
  async sektionLoeschen(sektionId: string) {
    return this.prisma.homepageSektion.delete({
      where: { id: sektionId },
    });
  }

  /**
   * Oeffentliche Homepage per Subdomain/Slug laden (fuer Besucher)
   */
  async oeffentlichLaden(subdomain: string) {
    const homepage = await this.prisma.homepage.findUnique({
      where: { subdomain },
      include: {
        sektionen: {
          where: { istSichtbar: true },
          orderBy: { reihenfolge: 'asc' },
        },
        tenant: {
          include: {
            abteilungen: true,
            teams: true,
            sponsoren: { where: { istAktiv: true } },
          },
        },
      },
    });

    if (!homepage || !homepage.istAktiv) {
      throw new NotFoundException('Homepage nicht gefunden oder nicht aktiv.');
    }

    // Naechste Events laden
    const events = await this.prisma.event.findMany({
      where: {
        tenantId: homepage.tenantId,
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
      take: 5,
      include: { team: true },
    });

    // Mitgliederzahl aktualisieren
    const mitgliederAnzahl = await this.prisma.member.count({
      where: { tenantId: homepage.tenantId, status: 'ACTIVE' },
    });

    return {
      ...homepage,
      mitgliederAnzahl,
      events,
    };
  }

  // ==================== Turnier-Landingpages ====================

  /**
   * Turnier-Landingpage erstellen
   */
  async turnierLandingpageErstellen(
    tournamentId: string,
    daten: {
      slug: string;
      titel: string;
      beschreibung?: string;
      bannerBildUrl?: string;
      ort?: string;
      datum?: string;
      teilnahmeInfo?: string;
      preise?: string;
      kontaktEmail?: string;
    },
  ) {
    return this.prisma.turnierLandingpage.create({
      data: {
        tournamentId,
        ...daten,
      },
    });
  }

  /**
   * Turnier-Landingpage aktualisieren
   */
  async turnierLandingpageAktualisieren(
    id: string,
    daten: {
      titel?: string;
      beschreibung?: string;
      bannerBildUrl?: string;
      ort?: string;
      datum?: string;
      teilnahmeInfo?: string;
      preise?: string;
      sponsoren?: string[];
      sponsorLogos?: string[];
      kontaktEmail?: string;
      istAktiv?: boolean;
      seoTitel?: string;
      seoBeschreibung?: string;
    },
  ) {
    return this.prisma.turnierLandingpage.update({
      where: { id },
      data: daten,
    });
  }

  /**
   * Oeffentliche Turnier-Landingpage laden (fuer Besucher)
   */
  async turnierLandingpageOeffentlich(slug: string) {
    const landingpage = await this.prisma.turnierLandingpage.findUnique({
      where: { slug },
      include: {
        tournament: {
          include: {
            matches: { orderBy: { time: 'asc' } },
            tenant: true,
          },
        },
      },
    });

    if (!landingpage || !landingpage.istAktiv) {
      throw new NotFoundException('Turnier-Seite nicht gefunden.');
    }

    return landingpage;
  }
}
