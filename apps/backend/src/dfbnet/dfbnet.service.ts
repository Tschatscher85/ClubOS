import { Injectable, Logger } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Zuordnung DFBnet-Abteilung → ClubOS Sport-Enum */
const ABTEILUNG_ZU_SPORT: Record<string, string> = {
  fussball: 'FUSSBALL',
  fußball: 'FUSSBALL',
  handball: 'HANDBALL',
  basketball: 'BASKETBALL',
  football: 'FOOTBALL',
  tennis: 'TENNIS',
  turnen: 'TURNEN',
  schwimmen: 'SCHWIMMEN',
  leichtathletik: 'LEICHTATHLETIK',
};

/** Zuordnung ClubOS Sport-Enum → DFBnet-Abteilung */
const SPORT_ZU_ABTEILUNG: Record<string, string> = {
  FUSSBALL: 'Fussball',
  HANDBALL: 'Handball',
  BASKETBALL: 'Basketball',
  FOOTBALL: 'Football',
  TENNIS: 'Tennis',
  TURNEN: 'Turnen',
  SCHWIMMEN: 'Schwimmen',
  LEICHTATHLETIK: 'Leichtathletik',
  SONSTIGES: 'Sonstiges',
};

/** DFBnet CSV-Spalten in der erwarteten Reihenfolge */
const CSV_SPALTEN = [
  'Anrede',
  'Vorname',
  'Nachname',
  'Geburtsdatum',
  'Strasse',
  'PLZ',
  'Ort',
  'Telefon',
  'Mobiltelefon',
  'E-Mail',
  'Eintrittsdatum',
  'Austrittsdatum',
  'Abteilung',
  'Beitrag',
  'IBAN',
  'BIC',
  'Mandatsreferenz',
  'Mitgliedsnummer',
];

export interface ImportErgebnis {
  importiert: number;
  uebersprungen: number;
  fehler: string[];
}

interface CsvZeile {
  [key: string]: string;
}

@Injectable()
export class DfbnetService {
  private readonly logger = new Logger(DfbnetService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Importiert Mitglieder aus einer DFBnet-CSV-Datei.
   * Erkennt Duplikate anhand von Vorname + Nachname + Geburtsdatum.
   */
  async csvImportieren(
    tenantId: string,
    csvContent: string,
  ): Promise<ImportErgebnis> {
    const ergebnis: ImportErgebnis = {
      importiert: 0,
      uebersprungen: 0,
      fehler: [],
    };

    // BOM entfernen falls vorhanden
    const bereinigterInhalt = csvContent.replace(/^\uFEFF/, '');

    const zeilen = bereinigterInhalt.split(/\r?\n/).filter((z) => z.trim());

    if (zeilen.length < 2) {
      ergebnis.fehler.push(
        'CSV-Datei enthaelt keine Daten (mindestens Kopfzeile und eine Datenzeile erforderlich).',
      );
      return ergebnis;
    }

    // Kopfzeile parsen
    const kopfzeile = this.csvZeileParsen(zeilen[0]);
    const spaltenIndex = new Map<string, number>();
    kopfzeile.forEach((spalte, index) => {
      spaltenIndex.set(spalte.trim(), index);
    });

    // Pflichtfelder pruefen
    const pflichtfelder = ['Vorname', 'Nachname'];
    for (const feld of pflichtfelder) {
      if (!spaltenIndex.has(feld)) {
        ergebnis.fehler.push(
          `Pflichtfeld "${feld}" fehlt in der CSV-Kopfzeile.`,
        );
      }
    }
    if (ergebnis.fehler.length > 0) {
      return ergebnis;
    }

    // Bestehende Mitglieder laden fuer Duplikat-Erkennung
    const bestehendeMembers = await this.prisma.member.findMany({
      where: { tenantId },
      select: { firstName: true, lastName: true, birthDate: true },
    });

    const duplikatSet = new Set(
      bestehendeMembers.map((m) =>
        this.duplikatSchluessel(
          m.firstName,
          m.lastName,
          m.birthDate,
        ),
      ),
    );

    // Aktuelle Anzahl fuer Mitgliedsnummern-Generierung
    let laufendeNummer =
      (await this.prisma.member.count({ where: { tenantId } })) + 1;

    // Datenzeilen verarbeiten
    for (let i = 1; i < zeilen.length; i++) {
      try {
        const werte = this.csvZeileParsen(zeilen[i]);
        const zeileObj = this.werteZuObjekt(kopfzeile, werte);

        const vorname = (zeileObj['Vorname'] || '').trim();
        const nachname = (zeileObj['Nachname'] || '').trim();

        if (!vorname || !nachname) {
          ergebnis.fehler.push(
            `Zeile ${i + 1}: Vorname oder Nachname fehlt.`,
          );
          continue;
        }

        const geburtsdatum = this.deutschesDatumParsen(
          zeileObj['Geburtsdatum'],
        );

        // Duplikat-Pruefung
        const schluessel = this.duplikatSchluessel(
          vorname,
          nachname,
          geburtsdatum,
        );
        if (duplikatSet.has(schluessel)) {
          ergebnis.uebersprungen++;
          continue;
        }

        // Adresse zusammensetzen
        const adressteile = [
          zeileObj['Strasse'],
          [zeileObj['PLZ'], zeileObj['Ort']].filter(Boolean).join(' '),
        ].filter(Boolean);
        const adresse = adressteile.length > 0 ? adressteile.join(', ') : null;

        // Telefon: Mobil bevorzugen, sonst Festnetz
        const telefon =
          (zeileObj['Mobiltelefon'] || zeileObj['Telefon'] || '').trim() ||
          null;

        // Sport/Abteilung mappen
        const abteilung = (zeileObj['Abteilung'] || '').trim().toLowerCase();
        const sport = ABTEILUNG_ZU_SPORT[abteilung]
          ? [ABTEILUNG_ZU_SPORT[abteilung]]
          : abteilung
            ? ['SONSTIGES']
            : [];

        // Eintrittsdatum
        const eintrittsdatum = this.deutschesDatumParsen(
          zeileObj['Eintrittsdatum'],
        );

        // Austrittsdatum
        const austrittsdatum = this.deutschesDatumParsen(
          zeileObj['Austrittsdatum'],
        );

        // Mitgliedsnummer: DFBnet-Nummer uebernehmen oder neu generieren
        const mitgliedsnummer =
          (zeileObj['Mitgliedsnummer'] || '').trim() ||
          `M-${String(laufendeNummer).padStart(4, '0')}`;

        // Status bestimmen
        const status: MemberStatus = austrittsdatum
          ? MemberStatus.CANCELLED
          : MemberStatus.ACTIVE;

        await this.prisma.member.create({
          data: {
            tenantId,
            memberNumber: mitgliedsnummer,
            firstName: vorname,
            lastName: nachname,
            email: (zeileObj['E-Mail'] || '').trim() || null,
            birthDate: geburtsdatum,
            phone: telefon,
            address: adresse,
            sport,
            joinDate: eintrittsdatum || new Date(),
            exitDate: austrittsdatum,
            status,
          },
        });

        duplikatSet.add(schluessel);
        laufendeNummer++;
        ergebnis.importiert++;
      } catch (fehler) {
        const meldung =
          fehler instanceof Error ? fehler.message : String(fehler);
        ergebnis.fehler.push(`Zeile ${i + 1}: ${meldung}`);
        this.logger.warn(`Fehler beim Import Zeile ${i + 1}: ${meldung}`);
      }
    }

    this.logger.log(
      `DFBnet-Import fuer Tenant ${tenantId}: ${ergebnis.importiert} importiert, ${ergebnis.uebersprungen} uebersprungen, ${ergebnis.fehler.length} Fehler`,
    );

    return ergebnis;
  }

  /**
   * Exportiert alle aktiven Mitglieder als DFBnet-kompatible CSV-Datei.
   * Enthaelt BOM fuer Excel-Kompatibilitaet.
   */
  async csvExportieren(tenantId: string): Promise<string> {
    const mitglieder = await this.prisma.member.findMany({
      where: {
        tenantId,
        status: { in: [MemberStatus.ACTIVE, MemberStatus.PENDING] },
      },
      orderBy: { lastName: 'asc' },
    });

    // BOM fuer Excel-Kompatibilitaet
    const bom = '\uFEFF';

    // Kopfzeile
    const kopfzeile = CSV_SPALTEN.join(';');

    // Datenzeilen
    const datenzeilen = mitglieder.map((m) => {
      const adressTeile = this.adresseAufteilen(m.address);
      const sportText =
        m.sport.length > 0
          ? (SPORT_ZU_ABTEILUNG[m.sport[0]] || m.sport[0])
          : '';

      const werte = [
        '', // Anrede - nicht in ClubOS gespeichert
        this.csvWertEscapen(m.firstName),
        this.csvWertEscapen(m.lastName),
        this.datumFormatieren(m.birthDate),
        this.csvWertEscapen(adressTeile.strasse),
        this.csvWertEscapen(adressTeile.plz),
        this.csvWertEscapen(adressTeile.ort),
        this.csvWertEscapen(m.phone || ''),
        '', // Mobiltelefon - nicht separat gespeichert
        this.csvWertEscapen(m.email || ''),
        this.datumFormatieren(m.joinDate),
        this.datumFormatieren(m.exitDate),
        this.csvWertEscapen(sportText),
        '', // Beitrag
        '', // IBAN
        '', // BIC
        '', // Mandatsreferenz
        this.csvWertEscapen(m.memberNumber),
      ];

      return werte.join(';');
    });

    return bom + [kopfzeile, ...datenzeilen].join('\r\n');
  }

  // ==================== Hilfsfunktionen ====================

  /**
   * Parst eine CSV-Zeile mit Semikolon-Trennung.
   * Beruecksichtigt Werte in Anfuehrungszeichen.
   */
  private csvZeileParsen(zeile: string): string[] {
    const ergebnis: string[] = [];
    let aktuellerWert = '';
    let inAnfuehrungszeichen = false;

    for (let i = 0; i < zeile.length; i++) {
      const zeichen = zeile[i];

      if (zeichen === '"') {
        if (inAnfuehrungszeichen && zeile[i + 1] === '"') {
          // Escaped Anfuehrungszeichen
          aktuellerWert += '"';
          i++;
        } else {
          inAnfuehrungszeichen = !inAnfuehrungszeichen;
        }
      } else if (zeichen === ';' && !inAnfuehrungszeichen) {
        ergebnis.push(aktuellerWert);
        aktuellerWert = '';
      } else {
        aktuellerWert += zeichen;
      }
    }

    ergebnis.push(aktuellerWert);
    return ergebnis;
  }

  /** Ordnet Werte den Spaltennamen zu */
  private werteZuObjekt(kopfzeile: string[], werte: string[]): CsvZeile {
    const obj: CsvZeile = {};
    kopfzeile.forEach((spalte, index) => {
      obj[spalte.trim()] = (werte[index] || '').trim();
    });
    return obj;
  }

  /** Parst ein deutsches Datum (DD.MM.YYYY) in ein Date-Objekt */
  private deutschesDatumParsen(wert: string | undefined): Date | null {
    if (!wert || !wert.trim()) return null;

    const teile = wert.trim().split('.');
    if (teile.length !== 3) return null;

    const tag = parseInt(teile[0], 10);
    const monat = parseInt(teile[1], 10);
    const jahr = parseInt(teile[2], 10);

    if (isNaN(tag) || isNaN(monat) || isNaN(jahr)) return null;
    if (tag < 1 || tag > 31 || monat < 1 || monat > 12) return null;

    return new Date(jahr, monat - 1, tag);
  }

  /** Formatiert ein Date-Objekt als DD.MM.YYYY */
  private datumFormatieren(datum: Date | null | undefined): string {
    if (!datum) return '';
    const d = new Date(datum);
    const tag = String(d.getDate()).padStart(2, '0');
    const monat = String(d.getMonth() + 1).padStart(2, '0');
    const jahr = d.getFullYear();
    return `${tag}.${monat}.${jahr}`;
  }

  /** Escaped einen Wert fuer CSV (Anfuehrungszeichen bei Semikolon/Zeilenumbruch) */
  private csvWertEscapen(wert: string): string {
    if (wert.includes(';') || wert.includes('"') || wert.includes('\n')) {
      return `"${wert.replace(/"/g, '""')}"`;
    }
    return wert;
  }

  /** Erzeugt einen Schluessel zur Duplikat-Erkennung */
  private duplikatSchluessel(
    vorname: string,
    nachname: string,
    geburtsdatum: Date | null,
  ): string {
    const datumStr = geburtsdatum
      ? geburtsdatum.toISOString().split('T')[0]
      : 'kein-datum';
    return `${vorname.toLowerCase().trim()}|${nachname.toLowerCase().trim()}|${datumStr}`;
  }

  /** Versucht eine Adresse in Strasse, PLZ und Ort aufzuteilen */
  private adresseAufteilen(adresse: string | null): {
    strasse: string;
    plz: string;
    ort: string;
  } {
    if (!adresse) return { strasse: '', plz: '', ort: '' };

    // Versuche Format "Strasse, PLZ Ort" zu parsen
    const teile = adresse.split(',').map((t) => t.trim());

    if (teile.length >= 2) {
      const strasse = teile[0];
      const plzOrt = teile[teile.length - 1];
      const plzMatch = plzOrt.match(/^(\d{5})\s+(.+)$/);

      if (plzMatch) {
        return { strasse, plz: plzMatch[1], ort: plzMatch[2] };
      }

      return { strasse, plz: '', ort: plzOrt };
    }

    return { strasse: adresse, plz: '', ort: '' };
  }
}
