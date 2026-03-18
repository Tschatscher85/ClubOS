import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KiService } from '../ki/ki.service';

@Injectable()
export class HomepageService {
  private readonly logger = new Logger(HomepageService.name);

  constructor(
    private prisma: PrismaService,
    private kiService: KiService,
  ) {}

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

  // ==================== KI-Generierung ====================

  /**
   * Generiert Homepage-Inhalte mit KI basierend auf den Vereinsdaten.
   */
  async mitKiGenerieren(tenantId: string) {
    // Alle Vereinsdaten parallel laden
    const [tenant, abteilungen, teams, mitgliederAnzahl, sponsoren, events] =
      await Promise.all([
        this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { name: true, slug: true, primaryColor: true },
        }),
        this.prisma.abteilung.findMany({
          where: { tenantId },
          select: { name: true, sport: true, beschreibung: true },
        }),
        this.prisma.team.findMany({
          where: { tenantId },
          select: { name: true, sport: true, ageGroup: true },
        }),
        this.prisma.member.count({
          where: { tenantId, status: 'ACTIVE' },
        }),
        this.prisma.sponsor.findMany({
          where: { tenantId, istAktiv: true },
          select: { name: true },
        }),
        this.prisma.event.findMany({
          where: {
            tenantId,
            date: { gte: new Date() },
          },
          orderBy: { date: 'asc' },
          take: 10,
          select: { title: true, type: true, date: true, location: true },
        }),
      ]);

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    // Vereinsdaten als Kontext fuer die KI zusammenstellen
    const vereinsDaten = {
      vereinsname: tenant.name,
      slug: tenant.slug,
      primaerfarbe: tenant.primaryColor,
      abteilungen: abteilungen.map((a) => ({
        name: a.name,
        sport: a.sport,
        beschreibung: a.beschreibung,
      })),
      mannschaften: teams.map((t) => ({
        name: t.name,
        sport: t.sport,
        altersklasse: t.ageGroup,
      })),
      mitgliederAnzahl,
      sponsoren: sponsoren.map((s) => s.name),
      naechsteTermine: events.map((e) => ({
        titel: e.title,
        typ: e.type,
        datum: e.date,
        ort: e.location,
      })),
    };

    const systemPrompt = `Du bist ein professioneller Webdesigner fuer Sportvereine. Erstelle moderne, einladende Texte fuer die Vereinshomepage. Antworte NUR mit validem JSON ohne Markdown-Codeblocks.

Das JSON muss folgende Struktur haben:
{
  "heroTitel": "Willkommens-Ueberschrift (max 60 Zeichen)",
  "heroUntertitel": "Kurzer Untertitel (max 100 Zeichen)",
  "ueberUns": "HTML-formatierter Text ueber den Verein (2-3 Absaetze mit <p> Tags, ca. 150-250 Woerter). Erwaehne die Abteilungen, Mitgliederzahl und was den Verein besonders macht.",
  "kontaktText": "Einladender Text fuer die Kontakt-Sektion (1-2 Saetze)",
  "mitgliedWerdenText": "Motivierender CTA-Text warum man Mitglied werden sollte (2-3 Saetze)",
  "sektionen": {
    "HERO": { "titel": "Vereinsname oder Slogan", "inhalt": "Kurzer Willkommenstext" },
    "UEBER_UNS": { "titel": "Ueber uns", "inhalt": "Kurzversion des Ueber-uns-Texts (1-2 Saetze)" },
    "ABTEILUNGEN": { "titel": "Unsere Abteilungen", "inhalt": "Einleitungstext zu den Abteilungen" },
    "MANNSCHAFTEN": { "titel": "Unsere Mannschaften", "inhalt": "Einleitungstext zu den Mannschaften" },
    "TERMINE": { "titel": "Naechste Termine", "inhalt": "Einleitungstext zu den Terminen" },
    "MITGLIED_WERDEN": { "titel": "Mitglied werden", "inhalt": "Der CTA-Text" },
    "SPONSOREN": { "titel": "Unsere Partner & Sponsoren", "inhalt": "Dankestext an die Sponsoren" },
    "KONTAKT": { "titel": "Kontakt", "inhalt": "Der Kontakttext" }
  }
}

Wichtig:
- Alle Texte auf Deutsch
- Verwende den tatsaechlichen Vereinsnamen
- Beziehe dich auf die konkreten Abteilungen und Sportarten
- Der Ton soll freundlich, modern und einladend sein
- Verwende keine Emojis
- HTML nur im ueberUns-Feld, alle anderen Felder als Plaintext`;

    const userPrompt = `Erstelle die Homepage-Texte fuer folgenden Verein:\n\n${JSON.stringify(vereinsDaten, null, 2)}`;

    let kiAntwort;
    try {
      kiAntwort = await this.kiService.textGenerieren(
        tenantId,
        systemPrompt,
        userPrompt,
      );
    } catch (fehler) {
      this.logger.error('KI-Generierung fehlgeschlagen', fehler);
      throw new BadRequestException(
        'KI-Generierung fehlgeschlagen. Bitte pruefen Sie die KI-Konfiguration in den Vereinseinstellungen.',
      );
    }

    // JSON aus der KI-Antwort parsen
    let generierteInhalte;
    try {
      // Eventuell enthaelt die Antwort Markdown-Codeblocks - diese entfernen
      let jsonText = kiAntwort.text.trim();
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      }
      generierteInhalte = JSON.parse(jsonText);
    } catch (fehler) {
      this.logger.error(
        'KI-Antwort konnte nicht als JSON geparst werden',
        kiAntwort.text,
      );
      throw new BadRequestException(
        'Die KI-Antwort konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.',
      );
    }

    // Homepage erstellen oder abrufen
    let homepage = await this.prisma.homepage.findUnique({
      where: { tenantId },
      include: { sektionen: { orderBy: { reihenfolge: 'asc' } } },
    });

    if (!homepage) {
      homepage = await this.erstellen(tenantId);
    }

    // Homepage mit generierten Inhalten aktualisieren
    const aktualisierteHomepage = await this.prisma.homepage.update({
      where: { tenantId },
      data: {
        heroTitel: generierteInhalte.heroTitel,
        heroUntertitel: generierteInhalte.heroUntertitel,
        ueberUns: generierteInhalte.ueberUns,
        mitgliederAnzahl,
      },
      include: { sektionen: { orderBy: { reihenfolge: 'asc' } } },
    });

    // Sektionen mit generierten Inhalten aktualisieren
    if (generierteInhalte.sektionen) {
      for (const sektion of aktualisierteHomepage.sektionen) {
        const generierteSektion = generierteInhalte.sektionen[sektion.typ];
        if (generierteSektion) {
          await this.prisma.homepageSektion.update({
            where: { id: sektion.id },
            data: {
              titel: generierteSektion.titel || sektion.titel,
              inhalt: generierteSektion.inhalt || sektion.inhalt,
            },
          });
        }
      }
    }

    // Aktualisierte Homepage mit allen Sektionen zurueckgeben
    return this.prisma.homepage.findUnique({
      where: { tenantId },
      include: { sektionen: { orderBy: { reihenfolge: 'asc' } } },
    });
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

  // ==================== Event-Landingpages ====================

  /**
   * Event-Landingpage erstellen
   */
  async eventLandingpageErstellen(
    eventId: string,
    daten: {
      slug: string;
      titel: string;
      beschreibung?: string;
      bannerBildUrl?: string;
      ort?: string;
      datum?: string;
      zeitplan?: string;
      anfahrt?: string;
      kontaktEmail?: string;
      kontaktTelefon?: string;
    },
  ) {
    return this.prisma.eventLandingpage.create({
      data: {
        eventId,
        ...daten,
      },
    });
  }

  /**
   * Event-Landingpage aktualisieren
   */
  async eventLandingpageAktualisieren(
    id: string,
    daten: {
      titel?: string;
      beschreibung?: string;
      bannerBildUrl?: string;
      ort?: string;
      datum?: string;
      zeitplan?: string;
      anfahrt?: string;
      kontaktEmail?: string;
      kontaktTelefon?: string;
      istAktiv?: boolean;
      seoTitel?: string;
      seoBeschreibung?: string;
    },
  ) {
    return this.prisma.eventLandingpage.update({
      where: { id },
      data: daten,
    });
  }

  /**
   * Oeffentliche Event-Landingpage laden (fuer Besucher)
   */
  async eventLandingpageOeffentlich(slug: string) {
    const landingpage = await this.prisma.eventLandingpage.findUnique({
      where: { slug },
      include: {
        event: {
          include: {
            team: true,
            attendances: true,
          },
        },
      },
    });

    if (!landingpage || !landingpage.istAktiv) {
      throw new NotFoundException('Event-Seite nicht gefunden.');
    }

    // Anwesenheitsstatistik berechnen
    const zusagen = landingpage.event.attendances.filter(
      (a) => a.status === 'YES',
    ).length;
    const absagen = landingpage.event.attendances.filter(
      (a) => a.status === 'NO',
    ).length;
    const offen = landingpage.event.attendances.filter(
      (a) => a.status === 'PENDING',
    ).length;

    // Attendances-Details nicht oeffentlich zurueckgeben
    const { attendances, ...eventOhneTeilnahmen } = landingpage.event;

    return {
      ...landingpage,
      event: eventOhneTeilnahmen,
      teilnahmeStatistik: {
        zusagen,
        absagen,
        offen,
        gesamt: attendances.length,
      },
    };
  }
}
