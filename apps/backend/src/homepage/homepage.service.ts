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

  /**
   * Oeffentliche Mannschaftsliste per Slug laden
   */
  async oeffentlichTeamsLaden(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    const teams = await this.prisma.team.findMany({
      where: { tenantId: tenant.id },
      include: { abteilung: { select: { name: true, sport: true } } },
      orderBy: [{ sport: 'asc' }, { ageGroup: 'asc' }],
    });

    return { verein: tenant.name, teams };
  }

  /**
   * Oeffentliche Terminliste per Slug laden
   */
  async oeffentlichEventsLaden(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    const events = await this.prisma.event.findMany({
      where: {
        tenantId: tenant.id,
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
      take: 20,
      include: { team: { select: { name: true, sport: true } } },
    });

    return { verein: tenant.name, events };
  }

  // ==================== Oeffentlicher Vereinskalender ====================

  /**
   * Gibt alle Events eines Vereins fuer einen bestimmten Monat zurueck.
   * Oeffentlich zugaenglich, kein Auth noetig.
   * Nur oeffentliche Felder: title, type, date, endDate, location, hallName, teamName.
   */
  async oeffentlicherKalender(slug: string, monat?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, logo: true, primaryColor: true },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    // Monat parsen (Format: YYYY-MM) oder aktuellen Monat verwenden
    let startDatum: Date;
    let endDatum: Date;

    if (monat && /^\d{4}-\d{2}$/.test(monat)) {
      const [jahr, mon] = monat.split('-').map(Number);
      startDatum = new Date(jahr, mon - 1, 1);
      endDatum = new Date(jahr, mon, 0, 23, 59, 59, 999);
    } else {
      const jetzt = new Date();
      startDatum = new Date(jetzt.getFullYear(), jetzt.getMonth(), 1);
      endDatum = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const events = await this.prisma.event.findMany({
      where: {
        tenantId: tenant.id,
        date: {
          gte: startDatum,
          lte: endDatum,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        endDate: true,
        location: true,
        hallName: true,
        team: { select: { name: true } },
      },
    });

    return {
      verein: {
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        primaryColor: tenant.primaryColor,
      },
      monat: {
        start: startDatum.toISOString(),
        ende: endDatum.toISOString(),
      },
      events: events.map((e) => ({
        id: e.id,
        titel: e.title,
        typ: e.type,
        datum: e.date,
        endDatum: e.endDate,
        ort: e.location,
        hallenName: e.hallName,
        teamName: e.team?.name || null,
      })),
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
   * Event-Landingpage nach Event-ID laden
   */
  async eventLandingpageLaden(eventId: string) {
    return this.prisma.eventLandingpage.findUnique({
      where: { eventId },
    });
  }

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

  // ==================== iCal Calendar Feed ====================

  /**
   * Generiert einen iCal-Feed (RFC 5545) fuer einen Verein oder ein Team.
   * Kann in Google Calendar, Apple Calendar, Outlook abonniert werden.
   */
  async icalFeed(slug: string, teamId?: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, email: true },
    });
    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden');
    }

    // Events der naechsten 12 Monate + letzten 1 Monat laden
    const jetzt = new Date();
    const vorEinemMonat = new Date(jetzt);
    vorEinemMonat.setMonth(vorEinemMonat.getMonth() - 1);
    const inZwoelfMonaten = new Date(jetzt);
    inZwoelfMonaten.setMonth(inZwoelfMonaten.getMonth() + 12);

    const where: Record<string, unknown> = {
      tenantId: tenant.id,
      date: {
        gte: vorEinemMonat,
        lte: inZwoelfMonaten,
      },
    };
    if (teamId) {
      where.teamId = teamId;
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        team: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
      take: 500,
    });

    // Team-Name fuer Kalender-Titel
    let kalenderName = tenant.name;
    if (teamId && events.length > 0) {
      kalenderName = `${tenant.name} - ${events[0].team.name}`;
    }

    // iCal generieren (RFC 5545)
    const zeilen: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//Vereinbase//${tenant.slug}//DE`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${this.icalEscape(kalenderName)}`,
      `X-WR-TIMEZONE:Europe/Berlin`,
    ];

    for (const event of events) {
      const start = this.icalDatum(new Date(event.date));
      const ende = event.endDate
        ? this.icalDatum(new Date(event.endDate))
        : this.icalDatum(new Date(new Date(event.date).getTime() + 90 * 60000)); // +90 Min Default

      zeilen.push('BEGIN:VEVENT');
      zeilen.push(`UID:${event.id}@${tenant.slug}.vereinbase.de`);
      zeilen.push(`DTSTAMP:${this.icalDatum(new Date())}`);
      zeilen.push(`DTSTART:${start}`);
      zeilen.push(`DTEND:${ende}`);
      zeilen.push(`SUMMARY:${this.icalEscape(event.title)}`);

      if (event.location) {
        let ort = event.location;
        if (event.hallName) ort = `${event.hallName}, ${ort}`;
        zeilen.push(`LOCATION:${this.icalEscape(ort)}`);
      }

      if (event.notes) {
        zeilen.push(`DESCRIPTION:${this.icalEscape(event.notes)}`);
      }

      // Kategorie nach Event-Typ
      const typLabel: Record<string, string> = {
        TRAINING: 'Training',
        MATCH: 'Spiel',
        TOURNAMENT: 'Turnier',
        EVENT: 'Veranstaltung',
        VOLUNTEER: 'Helfereinsatz',
        TRIP: 'Ausflug',
        MEETING: 'Besprechung',
      };
      zeilen.push(`CATEGORIES:${typLabel[event.type] || event.type}`);

      if (event.team?.name) {
        zeilen.push(`X-TEAM:${this.icalEscape(event.team.name)}`);
      }

      zeilen.push('END:VEVENT');
    }

    zeilen.push('END:VCALENDAR');
    return zeilen.join('\r\n');
  }

  /** Datum ins iCal-Format (UTC) */
  private icalDatum(d: Date): string {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /** Text fuer iCal escapen (Kommas, Semikolons, Zeilenumbrueche) */
  private icalEscape(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  // ==================== Oeffentliche Statistiken ====================

  /**
   * Oeffentliche Vereinsstatistiken laden
   */
  async oeffentlicheStatistiken(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        gruendungsjahr: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    const jetzt = new Date();
    const jahresBeginn = new Date(jetzt.getFullYear(), 0, 1);

    const [mitglieder, teams, sportarten, eventsImJahr, turniereImJahr] =
      await Promise.all([
        this.prisma.member.count({
          where: { tenantId: tenant.id, status: 'ACTIVE' },
        }),
        this.prisma.team.count({
          where: { tenantId: tenant.id },
        }),
        this.prisma.team
          .findMany({
            where: { tenantId: tenant.id },
            select: { sport: true },
            distinct: ['sport'],
          })
          .then((s) => s.length),
        this.prisma.event.count({
          where: {
            tenantId: tenant.id,
            date: { gte: jahresBeginn },
          },
        }),
        this.prisma.tournament.count({
          where: {
            tenantId: tenant.id,
            createdAt: { gte: jahresBeginn },
          },
        }),
      ]);

    return {
      tenant,
      statistiken: {
        mitglieder,
        teams,
        sportarten,
        eventsImJahr,
        turniereImJahr,
        gruendungsjahr: tenant.gruendungsjahr,
      },
    };
  }
}
