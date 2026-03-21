import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

interface AltersGruppe {
  label: string;
  anzahl: number;
  prozent: number;
}

interface TeamTrainingsStatistik {
  teamName: string;
  sport: string;
  altersklasse: string;
  anzahlTrainings: number;
  durchschnittAnwesenheit: number;
}

interface JahresberichtDaten {
  verein: {
    name: string;
    logo: string | null;
    anschrift: string | null;
    plz: string | null;
    ort: string | null;
    vereinsNr: string | null;
    amtsgericht: string | null;
    gruendungsjahr: number | null;
    vorstand1Name: string | null;
    vorstand1Funktion: string | null;
    landessportbund: string | null;
    sportverband: string | null;
    verbandsMitgliedsNr: string | null;
  };
  jahr: number;
  mitgliederJahresbeginn: number;
  mitgliederJahresende: number;
  zugaenge: number;
  abgaenge: number;
  altersstruktur: AltersGruppe[];
  sportartenVerteilung: { sport: string; anzahl: number }[];
  trainingsStatistik: TeamTrainingsStatistik[];
  veranstaltungen: {
    turniere: number;
    spiele: number;
    sonstige: number;
    gesamt: number;
  };
  zusammenfassung: {
    aktiveMitglieder: number;
    teams: number;
    veranstaltungenGesamt: number;
  };
}

@Injectable()
export class BerichtService {
  constructor(private prisma: PrismaService) {}

  async jahresberichtErstellen(
    tenantId: string,
    jahr: number,
  ): Promise<Buffer> {
    const daten = await this.datenSammeln(tenantId, jahr);
    return this.pdfErstellen(daten);
  }

  private async datenSammeln(
    tenantId: string,
    jahr: number,
  ): Promise<JahresberichtDaten> {
    const jahresbeginn = new Date(jahr, 0, 1);
    const jahresende = new Date(jahr, 11, 31, 23, 59, 59);
    const naechstesJahr = new Date(jahr + 1, 0, 1);

    // 1. Vereinsdaten
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    // 2. Mitgliederentwicklung
    // Aktive am 01.01. = Mitglieder die vor Jahresbeginn beigetreten sind und ACTIVE waren
    const mitgliederJahresbeginn = await this.prisma.member.count({
      where: {
        tenantId,
        joinDate: { lt: jahresbeginn },
        OR: [
          { status: 'ACTIVE' },
          // Mitglieder die im Laufe des Jahres ausgetreten sind, waren am 01.01. noch aktiv
          {
            status: { in: ['CANCELLED', 'INACTIVE'] },
            updatedAt: { gte: jahresbeginn },
          },
        ],
      },
    });

    // Aktive am 31.12.
    const mitgliederJahresende = await this.prisma.member.count({
      where: {
        tenantId,
        status: 'ACTIVE',
        joinDate: { lt: naechstesJahr },
      },
    });

    // Zugaenge: joinDate im Jahr
    const zugaenge = await this.prisma.member.count({
      where: {
        tenantId,
        joinDate: { gte: jahresbeginn, lt: naechstesJahr },
      },
    });

    // Abgaenge: Status CANCELLED/INACTIVE mit updatedAt im Jahr
    const abgaenge = await this.prisma.member.count({
      where: {
        tenantId,
        status: { in: ['CANCELLED', 'INACTIVE'] },
        updatedAt: { gte: jahresbeginn, lt: naechstesJahr },
      },
    });

    // 3. Altersstruktur (Stichtag 31.12. des Jahres)
    const aktiveMitglieder = await this.prisma.member.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        joinDate: { lt: naechstesJahr },
      },
      select: { birthDate: true },
    });

    const altersGruppen = [
      { label: 'Unter 6', min: 0, max: 5 },
      { label: '6-14', min: 6, max: 14 },
      { label: '14-18', min: 14, max: 18 },
      { label: '18-27', min: 18, max: 27 },
      { label: '27-40', min: 27, max: 40 },
      { label: '40-60', min: 40, max: 60 },
      { label: 'Ueber 60', min: 60, max: 200 },
    ];

    const altersstruktur: AltersGruppe[] = altersGruppen.map((gruppe) => {
      const anzahl = aktiveMitglieder.filter((m) => {
        if (!m.birthDate) return false;
        const alter = this.alterBerechnen(m.birthDate, jahresende);
        return alter >= gruppe.min && alter < gruppe.max;
      }).length;
      return {
        label: gruppe.label,
        anzahl,
        prozent:
          aktiveMitglieder.length > 0
            ? Math.round((anzahl / aktiveMitglieder.length) * 1000) / 10
            : 0,
      };
    });

    // Unbekanntes Alter (kein Geburtsdatum)
    const ohneGeburtsdatum = aktiveMitglieder.filter(
      (m) => !m.birthDate,
    ).length;
    if (ohneGeburtsdatum > 0) {
      altersstruktur.push({
        label: 'Unbekannt',
        anzahl: ohneGeburtsdatum,
        prozent:
          Math.round((ohneGeburtsdatum / aktiveMitglieder.length) * 1000) / 10,
      });
    }

    // 5. Sportarten-Verteilung
    const mitgliederMitSport = await this.prisma.member.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        joinDate: { lt: naechstesJahr },
      },
      select: { sport: true },
    });

    const sportZaehler: Record<string, number> = {};
    for (const m of mitgliederMitSport) {
      for (const s of m.sport) {
        sportZaehler[s] = (sportZaehler[s] || 0) + 1;
      }
    }
    const sportartenVerteilung = Object.entries(sportZaehler)
      .map(([sport, anzahl]) => ({ sport, anzahl }))
      .sort((a, b) => b.anzahl - a.anzahl);

    // 6. Trainingsstatistik pro Team
    const teams = await this.prisma.team.findMany({
      where: { tenantId },
      select: { id: true, name: true, sport: true, ageGroup: true },
    });

    const trainingsStatistik: TeamTrainingsStatistik[] = [];

    for (const team of teams) {
      const trainings = await this.prisma.event.findMany({
        where: {
          tenantId,
          teamId: team.id,
          type: 'TRAINING',
          date: { gte: jahresbeginn, lt: naechstesJahr },
        },
        select: { id: true },
      });

      if (trainings.length === 0) continue;

      const eventIds = trainings.map((t) => t.id);

      const gesamtAnmeldungen = await this.prisma.attendance.count({
        where: { eventId: { in: eventIds } },
      });

      const zugesagt = await this.prisma.attendance.count({
        where: { eventId: { in: eventIds }, status: 'YES' },
      });

      trainingsStatistik.push({
        teamName: team.name,
        sport: team.sport,
        altersklasse: team.ageGroup,
        anzahlTrainings: trainings.length,
        durchschnittAnwesenheit:
          gesamtAnmeldungen > 0
            ? Math.round((zugesagt / gesamtAnmeldungen) * 1000) / 10
            : 0,
      });
    }

    trainingsStatistik.sort((a, b) => b.anzahlTrainings - a.anzahlTrainings);

    // 7. Veranstaltungen
    const turniere = await this.prisma.event.count({
      where: {
        tenantId,
        type: 'TOURNAMENT',
        date: { gte: jahresbeginn, lt: naechstesJahr },
      },
    });

    const spiele = await this.prisma.event.count({
      where: {
        tenantId,
        type: 'MATCH',
        date: { gte: jahresbeginn, lt: naechstesJahr },
      },
    });

    const sonstigeEvents = await this.prisma.event.count({
      where: {
        tenantId,
        type: { in: ['EVENT', 'VOLUNTEER', 'TRIP', 'MEETING'] },
        date: { gte: jahresbeginn, lt: naechstesJahr },
      },
    });

    const veranstaltungenGesamt = await this.prisma.event.count({
      where: {
        tenantId,
        date: { gte: jahresbeginn, lt: naechstesJahr },
      },
    });

    // 8. Zusammenfassung
    const teamAnzahl = teams.length;

    return {
      verein: {
        name: tenant.name,
        logo: tenant.logo,
        anschrift: tenant.anschrift,
        plz: tenant.plz,
        ort: tenant.ort,
        vereinsNr: tenant.vereinsNr,
        amtsgericht: tenant.amtsgericht,
        gruendungsjahr: tenant.gruendungsjahr,
        vorstand1Name: tenant.vorstand1Name,
        vorstand1Funktion: tenant.vorstand1Funktion,
        landessportbund: tenant.landessportbund,
        sportverband: tenant.sportverband,
        verbandsMitgliedsNr: tenant.verbandsMitgliedsNr,
      },
      jahr,
      mitgliederJahresbeginn,
      mitgliederJahresende,
      zugaenge,
      abgaenge,
      altersstruktur,
      sportartenVerteilung,
      trainingsStatistik,
      veranstaltungen: {
        turniere,
        spiele,
        sonstige: sonstigeEvents,
        gesamt: veranstaltungenGesamt,
      },
      zusammenfassung: {
        aktiveMitglieder: mitgliederJahresende,
        teams: teamAnzahl,
        veranstaltungenGesamt,
      },
    };
  }

  private alterBerechnen(geburtsdatum: Date, stichtag: Date): number {
    let alter = stichtag.getFullYear() - geburtsdatum.getFullYear();
    const monatsDiff = stichtag.getMonth() - geburtsdatum.getMonth();
    if (
      monatsDiff < 0 ||
      (monatsDiff === 0 && stichtag.getDate() < geburtsdatum.getDate())
    ) {
      alter--;
    }
    return alter;
  }

  async jahresStatistikPoster(
    tenantId: string,
    jahr: number,
  ): Promise<Buffer> {
    const jahresbeginn = new Date(jahr, 0, 1);
    const naechstesJahr = new Date(jahr + 1, 0, 1);

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    const primaerFarbe = tenant.primaryColor || '#1a56db';

    // Daten sammeln
    const aktiveMitglieder = await this.prisma.member.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    const teams = await this.prisma.team.count({
      where: { tenantId },
    });

    const trainingseinheiten = await this.prisma.event.count({
      where: {
        tenantId,
        type: 'TRAINING',
        date: { gte: jahresbeginn, lt: naechstesJahr },
      },
    });

    const spiele = await this.prisma.event.count({
      where: {
        tenantId,
        type: 'MATCH',
        date: { gte: jahresbeginn, lt: naechstesJahr },
      },
    });

    const turniere = await this.prisma.event.count({
      where: {
        tenantId,
        type: 'TOURNAMENT',
        date: { gte: jahresbeginn, lt: naechstesJahr },
      },
    });

    // Anwesenheitsquote
    const alleEvents = await this.prisma.event.findMany({
      where: {
        tenantId,
        type: 'TRAINING',
        date: { gte: jahresbeginn, lt: naechstesJahr },
      },
      select: { id: true },
    });
    const eventIds = alleEvents.map((e) => e.id);
    let anwesenheitsquote = 0;
    if (eventIds.length > 0) {
      const gesamt = await this.prisma.attendance.count({
        where: { eventId: { in: eventIds } },
      });
      const zugesagt = await this.prisma.attendance.count({
        where: { eventId: { in: eventIds }, status: 'YES' },
      });
      anwesenheitsquote =
        gesamt > 0 ? Math.round((zugesagt / gesamt) * 100) : 0;
    }

    // Neue Mitglieder
    const neueMitglieder = await this.prisma.member.count({
      where: {
        tenantId,
        joinDate: { gte: jahresbeginn, lt: naechstesJahr },
      },
    });

    // Ehrenamtliche Stunden (falls Modul vorhanden)
    let ehrenamtStunden = 0;
    try {
      const stunden = await this.prisma.uebungsleiterStunden.findMany({
        where: {
          tenantId,
          datum: { gte: jahresbeginn, lt: naechstesJahr },
        },
        select: { stunden: true },
      });
      ehrenamtStunden = stunden.reduce(
        (sum: number, s: { stunden: number }) => sum + s.stunden,
        0,
      );
    } catch {
      // Tabelle existiert ggf. nicht
    }

    // PDF erstellen - A4 Landscape
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        info: {
          Title: `Vereinsjahr ${jahr} in Zahlen - ${tenant.name}`,
          Author: 'Vereinbase',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const breite = 842 - 100; // A4 landscape minus Raender
      const hoehe = 595 - 80;

      // Hintergrund
      doc.rect(0, 0, 842, 595).fill('#ffffff');

      // Oberer Farbbalken
      doc.rect(0, 0, 842, 8).fill(primaerFarbe);

      // Vereinsname
      doc
        .fontSize(32)
        .fillColor(primaerFarbe)
        .text(tenant.name, 50, 30, {
          align: 'center',
          width: breite,
        });

      // Untertitel
      doc
        .fontSize(18)
        .fillColor('#374151')
        .text(`Unser Vereinsjahr ${jahr} in Zahlen`, 50, 70, {
          align: 'center',
          width: breite,
        });

      // Trennlinie
      doc
        .moveTo(200, 100)
        .lineTo(642, 100)
        .strokeColor(primaerFarbe)
        .lineWidth(2)
        .stroke();

      // Statistik-Grid (2 Reihen x 4 Spalten)
      const statistiken = [
        { zahl: aktiveMitglieder.toString(), label: 'Aktive Mitglieder' },
        { zahl: teams.toString(), label: 'Teams' },
        { zahl: trainingseinheiten.toString(), label: 'Trainingseinheiten' },
        { zahl: spiele.toString(), label: 'Spiele' },
        { zahl: turniere.toString(), label: 'Turniere' },
        { zahl: `${anwesenheitsquote}%`, label: 'Anwesenheitsquote' },
        { zahl: neueMitglieder.toString(), label: 'Neue Mitglieder' },
        {
          zahl: ehrenamtStunden > 0 ? ehrenamtStunden.toString() : '-',
          label: 'Ehrenamtliche Std.',
        },
      ];

      const spalten = 4;
      const zellenBreite = breite / spalten;
      const zellenHoehe = 140;
      const startY = 130;

      statistiken.forEach((stat, index) => {
        const reihe = Math.floor(index / spalten);
        const spalte = index % spalten;
        const x = 50 + spalte * zellenBreite;
        const y = startY + reihe * zellenHoehe;

        // Hintergrund-Box
        doc
          .roundedRect(x + 10, y + 10, zellenBreite - 20, zellenHoehe - 20, 8)
          .fill('#f9fafb');

        // Zahl gross
        doc
          .fontSize(42)
          .fillColor(primaerFarbe)
          .text(stat.zahl, x + 10, y + 30, {
            width: zellenBreite - 20,
            align: 'center',
          });

        // Label
        doc
          .fontSize(12)
          .fillColor('#6b7280')
          .text(stat.label, x + 10, y + 85, {
            width: zellenBreite - 20,
            align: 'center',
          });
      });

      // Unterer Farbbalken
      doc.rect(0, 595 - 8, 842, 8).fill(primaerFarbe);

      // Footer
      doc
        .fontSize(10)
        .fillColor('#9ca3af')
        .text('Powered by Vereinbase', 50, 595 - 35, {
          align: 'center',
          width: breite,
        });

      doc.end();
    });
  }

  private async pdfErstellen(daten: JahresberichtDaten): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 60, left: 50, right: 50 },
        info: {
          Title: `Jahresbericht ${daten.jahr} - ${daten.verein.name}`,
          Author: 'Vereinbase',
          Subject: `Foerdermittel-Jahresbericht ${daten.jahr}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const seitenBreite = 495; // A4 minus Raender
      let seitenNummer = 1;

      // Farben
      const FARBE_DUNKEL = '#1a1a2e';
      const FARBE_AKZENT = '#1a56db';
      const FARBE_GRAU = '#6b7280';
      const FARBE_HELL = '#f3f4f6';

      // ==================== Hilfsfunktionen ====================

      const zeichneFusszeile = () => {
        const heute = new Date();
        const datumStr = `${heute.getDate().toString().padStart(2, '0')}.${(heute.getMonth() + 1).toString().padStart(2, '0')}.${heute.getFullYear()}`;
        doc
          .fontSize(8)
          .fillColor(FARBE_GRAU)
          .text(
            `Erstellt mit Vereinbase am ${datumStr}`,
            50,
            doc.page.height - 40,
            { align: 'left', width: seitenBreite / 2 },
          )
          .text(
            `Seite ${seitenNummer}`,
            50 + seitenBreite / 2,
            doc.page.height - 40,
            { align: 'right', width: seitenBreite / 2 },
          );
      };

      const neueSeiteFallsNoetig = (benoetigterPlatz: number) => {
        if (doc.y + benoetigterPlatz > doc.page.height - 80) {
          zeichneFusszeile();
          doc.addPage();
          seitenNummer++;
          doc.y = 60;
        }
      };

      const zeichneUeberschrift = (text: string, ebene: 1 | 2 = 1) => {
        neueSeiteFallsNoetig(60);
        doc.moveDown(ebene === 1 ? 1.5 : 0.8);
        if (ebene === 1) {
          // Linie ueber der Ueberschrift
          doc
            .moveTo(50, doc.y)
            .lineTo(50 + seitenBreite, doc.y)
            .strokeColor(FARBE_AKZENT)
            .lineWidth(2)
            .stroke();
          doc.moveDown(0.5);
          doc.fontSize(16).fillColor(FARBE_AKZENT).text(text, 50);
        } else {
          doc.fontSize(12).fillColor(FARBE_DUNKEL).text(text, 50);
        }
        doc.moveDown(0.5);
      };

      const zeichneTabelle = (
        spalten: { label: string; breite: number; align?: 'left' | 'right' | 'center' }[],
        zeilen: string[][],
      ) => {
        const zeilenHoehe = 22;
        const benoetigterPlatz = (zeilen.length + 1) * zeilenHoehe + 10;
        neueSeiteFallsNoetig(benoetigterPlatz);

        let x = 50;
        const startY = doc.y;

        // Kopfzeile
        doc
          .rect(50, startY, seitenBreite, zeilenHoehe)
          .fill(FARBE_AKZENT);
        for (const spalte of spalten) {
          doc
            .fontSize(9)
            .fillColor('#ffffff')
            .text(spalte.label, x + 4, startY + 6, {
              width: spalte.breite - 8,
              align: spalte.align || 'left',
            });
          x += spalte.breite;
        }

        // Datenzeilen
        let y = startY + zeilenHoehe;
        for (let i = 0; i < zeilen.length; i++) {
          // Abwechselnde Hintergrundfarbe
          if (i % 2 === 0) {
            doc.rect(50, y, seitenBreite, zeilenHoehe).fill(FARBE_HELL);
          }

          x = 50;
          for (let j = 0; j < spalten.length; j++) {
            doc
              .fontSize(9)
              .fillColor(FARBE_DUNKEL)
              .text(zeilen[i][j] || '', x + 4, y + 6, {
                width: spalten[j].breite - 8,
                align: spalten[j].align || 'left',
              });
            x += spalten[j].breite;
          }
          y += zeilenHoehe;
        }

        doc.y = y + 5;
      };

      const zeichneKennzahl = (
        label: string,
        wert: string,
        x: number,
        y: number,
        breite: number,
      ) => {
        doc
          .rect(x, y, breite, 50)
          .fill(FARBE_HELL);
        doc
          .fontSize(20)
          .fillColor(FARBE_AKZENT)
          .text(wert, x, y + 8, { width: breite, align: 'center' });
        doc
          .fontSize(8)
          .fillColor(FARBE_GRAU)
          .text(label, x, y + 34, { width: breite, align: 'center' });
      };

      // ==================== Titelseite ====================

      doc.moveDown(4);

      // Vereinsname gross
      doc
        .fontSize(28)
        .fillColor(FARBE_DUNKEL)
        .text(daten.verein.name, 50, doc.y, {
          align: 'center',
          width: seitenBreite,
        });
      doc.moveDown(0.5);

      // Titel
      doc
        .fontSize(22)
        .fillColor(FARBE_AKZENT)
        .text(`Jahresbericht ${daten.jahr}`, 50, doc.y, {
          align: 'center',
          width: seitenBreite,
        });
      doc.moveDown(0.3);

      doc
        .fontSize(12)
        .fillColor(FARBE_GRAU)
        .text('Foerdermittel-Jahresbericht', 50, doc.y, {
          align: 'center',
          width: seitenBreite,
        });
      doc.moveDown(3);

      // Vereinsdaten-Box
      const vereinsInfos: string[] = [];
      if (daten.verein.anschrift) vereinsInfos.push(daten.verein.anschrift);
      if (daten.verein.plz && daten.verein.ort)
        vereinsInfos.push(`${daten.verein.plz} ${daten.verein.ort}`);
      if (daten.verein.vereinsNr)
        vereinsInfos.push(`Vereinsregister: ${daten.verein.vereinsNr}`);
      if (daten.verein.amtsgericht)
        vereinsInfos.push(`Amtsgericht: ${daten.verein.amtsgericht}`);
      if (daten.verein.gruendungsjahr)
        vereinsInfos.push(`Gruendungsjahr: ${daten.verein.gruendungsjahr}`);
      if (daten.verein.landessportbund)
        vereinsInfos.push(`Landessportbund: ${daten.verein.landessportbund}`);
      if (daten.verein.sportverband)
        vereinsInfos.push(`Sportverband: ${daten.verein.sportverband}`);
      if (daten.verein.verbandsMitgliedsNr)
        vereinsInfos.push(
          `Verbands-Mitgliedsnr.: ${daten.verein.verbandsMitgliedsNr}`,
        );
      if (daten.verein.vorstand1Name) {
        const funktion = daten.verein.vorstand1Funktion || '1. Vorsitzender';
        vereinsInfos.push(`${funktion}: ${daten.verein.vorstand1Name}`);
      }

      if (vereinsInfos.length > 0) {
        const boxY = doc.y;
        const boxHoehe = vereinsInfos.length * 16 + 20;
        doc
          .rect(100, boxY, seitenBreite - 100, boxHoehe)
          .fill(FARBE_HELL);
        let infoY = boxY + 10;
        for (const info of vereinsInfos) {
          doc
            .fontSize(10)
            .fillColor(FARBE_DUNKEL)
            .text(info, 110, infoY, {
              width: seitenBreite - 120,
              align: 'center',
            });
          infoY += 16;
        }
        doc.y = boxY + boxHoehe;
      }

      // ==================== Neue Seite: Inhalte ====================

      zeichneFusszeile();
      doc.addPage();
      seitenNummer++;

      // ==================== Zusammenfassung (Kennzahlen) ====================

      zeichneUeberschrift('Zusammenfassung');

      const kennzahlBreite = seitenBreite / 3 - 10;
      const kennzahlY = doc.y;
      zeichneKennzahl(
        'Aktive Mitglieder',
        daten.zusammenfassung.aktiveMitglieder.toString(),
        50,
        kennzahlY,
        kennzahlBreite,
      );
      zeichneKennzahl(
        'Teams',
        daten.zusammenfassung.teams.toString(),
        50 + kennzahlBreite + 15,
        kennzahlY,
        kennzahlBreite,
      );
      zeichneKennzahl(
        'Veranstaltungen',
        daten.zusammenfassung.veranstaltungenGesamt.toString(),
        50 + (kennzahlBreite + 15) * 2,
        kennzahlY,
        kennzahlBreite,
      );
      doc.y = kennzahlY + 65;

      // ==================== Mitgliederentwicklung ====================

      zeichneUeberschrift('Mitgliederentwicklung');

      zeichneTabelle(
        [
          { label: 'Kennzahl', breite: 300 },
          { label: 'Anzahl', breite: 195, align: 'right' },
        ],
        [
          ['Mitglieder am 01.01.' + daten.jahr, daten.mitgliederJahresbeginn.toString()],
          ['Zugaenge im Jahr ' + daten.jahr, `+${daten.zugaenge}`],
          ['Abgaenge im Jahr ' + daten.jahr, `-${daten.abgaenge}`],
          ['Mitglieder am 31.12.' + daten.jahr, daten.mitgliederJahresende.toString()],
        ],
      );

      // Veraenderung
      const veraenderung = daten.mitgliederJahresende - daten.mitgliederJahresbeginn;
      const vorzeichen = veraenderung >= 0 ? '+' : '';
      doc
        .fontSize(10)
        .fillColor(FARBE_DUNKEL)
        .text(
          `Nettoveraenderung: ${vorzeichen}${veraenderung} Mitglieder`,
          50,
        );

      // ==================== Altersstruktur ====================

      zeichneUeberschrift('Altersstruktur (Stichtag 31.12.' + daten.jahr + ')');

      zeichneTabelle(
        [
          { label: 'Altersgruppe', breite: 200 },
          { label: 'Anzahl', breite: 145, align: 'right' },
          { label: 'Anteil', breite: 150, align: 'right' },
        ],
        daten.altersstruktur.map((g) => [
          g.label,
          g.anzahl.toString(),
          `${g.prozent}%`,
        ]),
      );

      // ==================== Sportarten-Verteilung ====================

      if (daten.sportartenVerteilung.length > 0) {
        zeichneUeberschrift('Sportarten-Verteilung');

        const sportartLabel = (s: string): string => {
          const labels: Record<string, string> = {
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
          return labels[s] || s;
        };

        zeichneTabelle(
          [
            { label: 'Sportart', breite: 300 },
            { label: 'Mitglieder', breite: 195, align: 'right' },
          ],
          daten.sportartenVerteilung.map((s) => [
            sportartLabel(s.sport),
            s.anzahl.toString(),
          ]),
        );
      }

      // ==================== Trainingsstatistik ====================

      if (daten.trainingsStatistik.length > 0) {
        zeichneUeberschrift('Trainingsstatistik');

        zeichneTabelle(
          [
            { label: 'Team', breite: 200 },
            { label: 'Sportart', breite: 95 },
            { label: 'Trainings', breite: 100, align: 'right' },
            { label: 'Anwesenheit', breite: 100, align: 'right' },
          ],
          daten.trainingsStatistik.map((t) => [
            t.teamName,
            t.sport,
            t.anzahlTrainings.toString(),
            `${t.durchschnittAnwesenheit}%`,
          ]),
        );
      }

      // ==================== Veranstaltungen ====================

      zeichneUeberschrift('Veranstaltungen');

      zeichneTabelle(
        [
          { label: 'Veranstaltungstyp', breite: 300 },
          { label: 'Anzahl', breite: 195, align: 'right' },
        ],
        [
          ['Turniere', daten.veranstaltungen.turniere.toString()],
          ['Spiele / Wettkampfe', daten.veranstaltungen.spiele.toString()],
          ['Sonstige Veranstaltungen', daten.veranstaltungen.sonstige.toString()],
          ['Gesamt (alle Typen inkl. Training)', daten.veranstaltungen.gesamt.toString()],
        ],
      );

      // ==================== Abschluss ====================

      neueSeiteFallsNoetig(100);
      doc.moveDown(2);
      doc
        .moveTo(50, doc.y)
        .lineTo(50 + seitenBreite, doc.y)
        .strokeColor(FARBE_GRAU)
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(1);

      doc
        .fontSize(10)
        .fillColor(FARBE_DUNKEL)
        .text(
          `Dieser Bericht wurde automatisch aus den Vereinsdaten des Jahres ${daten.jahr} erstellt ` +
            `und dient als Grundlage fuer Sportbund-Meldungen und kommunale Foerderantraege.`,
          50,
          doc.y,
          { width: seitenBreite },
        );

      doc.moveDown(1.5);

      if (daten.verein.vorstand1Name) {
        doc
          .fontSize(10)
          .fillColor(FARBE_DUNKEL)
          .text(
            `${daten.verein.ort || '_______________'}, den _______________`,
            50,
          );
        doc.moveDown(2);
        doc
          .moveTo(50, doc.y)
          .lineTo(250, doc.y)
          .strokeColor(FARBE_GRAU)
          .lineWidth(0.5)
          .stroke();
        doc.moveDown(0.3);
        const funktion = daten.verein.vorstand1Funktion || '1. Vorsitzender';
        doc
          .fontSize(9)
          .fillColor(FARBE_GRAU)
          .text(`${daten.verein.vorstand1Name} (${funktion})`, 50);
      }

      zeichneFusszeile();
      doc.end();
    });
  }
}
