import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleRechnungDto, ErstelleBeitragDto } from './dto/erstelle-rechnung.dto';

@Injectable()
export class BuchhaltungService {
  constructor(private prisma: PrismaService) {}

  // ==================== Rechnungen ====================

  /** Einzelne Rechnung erstellen */
  async rechnungErstellen(tenantId: string, dto: ErstelleRechnungDto) {
    return this.prisma.rechnung.create({
      data: {
        tenantId,
        memberId: dto.memberId,
        rechnungsNr: dto.rechnungsNr,
        betrag: dto.betrag,
        beschreibung: dto.beschreibung,
        faelligAm: new Date(dto.faelligAm),
        sepaMandat: dto.sepaMandat,
      },
    });
  }

  /** Rechnungen abrufen mit optionalen Filtern */
  async rechnungenAbrufen(
    tenantId: string,
    status?: string,
    memberId?: string,
  ) {
    return this.prisma.rechnung.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as 'OFFEN' | 'BEZAHLT' | 'UEBERFAELLIG' | 'STORNIERT' } : {}),
        ...(memberId ? { memberId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Rechnung als bezahlt markieren */
  async alsBezahltMarkieren(tenantId: string, id: string) {
    const rechnung = await this.prisma.rechnung.findFirst({
      where: { id, tenantId },
    });

    if (!rechnung) {
      throw new NotFoundException('Rechnung nicht gefunden.');
    }

    return this.prisma.rechnung.update({
      where: { id },
      data: {
        status: 'BEZAHLT',
        bezahltAm: new Date(),
      },
    });
  }

  /** Rechnung stornieren */
  async stornieren(tenantId: string, id: string) {
    const rechnung = await this.prisma.rechnung.findFirst({
      where: { id, tenantId },
    });

    if (!rechnung) {
      throw new NotFoundException('Rechnung nicht gefunden.');
    }

    return this.prisma.rechnung.update({
      where: { id },
      data: { status: 'STORNIERT' },
    });
  }

  /**
   * Massenrechnungen erstellen fuer alle aktiven Mitglieder
   * basierend auf einem Beitragstemplate.
   */
  async rechnungenErstellen(tenantId: string, beitragId: string) {
    const beitrag = await this.prisma.beitrag.findFirst({
      where: { id: beitragId, tenantId },
    });

    if (!beitrag) {
      throw new NotFoundException('Beitragsvorlage nicht gefunden.');
    }

    // Aktive Mitglieder abrufen, optional nach Sportart filtern
    const filter: Record<string, unknown> = {
      tenantId,
      status: 'ACTIVE',
    };

    if (beitrag.sportart) {
      filter.sport = { has: beitrag.sportart };
    }

    const mitglieder = await this.prisma.member.findMany({
      where: filter,
      select: { id: true, memberNumber: true },
    });

    if (mitglieder.length === 0) {
      throw new NotFoundException(
        'Keine aktiven Mitglieder fuer die Rechnungserstellung gefunden.',
      );
    }

    // Faelligkeitsdatum: 30 Tage ab jetzt
    const faelligAm = new Date();
    faelligAm.setDate(faelligAm.getDate() + 30);

    // Rechnungsnummer-Praefix: JJJJMM
    const jetzt = new Date();
    const praefix = `${jetzt.getFullYear()}${String(jetzt.getMonth() + 1).padStart(2, '0')}`;

    const rechnungen = mitglieder.map((mitglied, index) => ({
      tenantId,
      memberId: mitglied.id,
      rechnungsNr: `${praefix}-${String(index + 1).padStart(4, '0')}`,
      betrag: beitrag.betrag,
      beschreibung: beitrag.name,
      faelligAm,
    }));

    const ergebnis = await this.prisma.rechnung.createMany({
      data: rechnungen,
    });

    return {
      nachricht: `${ergebnis.count} Rechnungen erfolgreich erstellt.`,
      anzahl: ergebnis.count,
      beitrag: beitrag.name,
      betrag: beitrag.betrag,
    };
  }

  /** Ueberfaellige Rechnungen pruefen und markieren */
  async ueberfaelligePruefen(tenantId: string) {
    const jetzt = new Date();

    const ergebnis = await this.prisma.rechnung.updateMany({
      where: {
        tenantId,
        status: 'OFFEN',
        faelligAm: { lt: jetzt },
      },
      data: { status: 'UEBERFAELLIG' },
    });

    return {
      nachricht: `${ergebnis.count} Rechnungen als ueberfaellig markiert.`,
      anzahl: ergebnis.count,
    };
  }

  /**
   * DATEV-Export: Rechnungsdaten als CSV-formatierter String
   * fuer den Zeitraum von-bis.
   */
  async datevExport(tenantId: string, von: string, bis: string) {
    const rechnungen = await this.prisma.rechnung.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(von),
          lte: new Date(bis),
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // CSV-Header
    const header =
      'Rechnungsnummer;Betrag;Beschreibung;Status;Faellig am;Bezahlt am;Erstellt am;SEPA-Mandat';

    const zeilen = rechnungen.map((r) =>
      [
        r.rechnungsNr,
        r.betrag.toFixed(2).replace('.', ','),
        `"${r.beschreibung}"`,
        r.status,
        r.faelligAm.toISOString().split('T')[0],
        r.bezahltAm ? r.bezahltAm.toISOString().split('T')[0] : '',
        r.createdAt.toISOString().split('T')[0],
        r.sepaMandat || '',
      ].join(';'),
    );

    return {
      dateiname: `DATEV_Export_${von}_bis_${bis}.csv`,
      inhalt: [header, ...zeilen].join('\n'),
      anzahlDatensaetze: rechnungen.length,
    };
  }

  /** Finanzstatistik: offene, bezahlte, ueberfaellige Betraege */
  async statistik(tenantId: string) {
    const rechnungen = await this.prisma.rechnung.findMany({
      where: { tenantId },
      select: { betrag: true, status: true },
    });

    const statistik = {
      gesamtOffen: 0,
      gesamtBezahlt: 0,
      gesamtUeberfaellig: 0,
      gesamtStorniert: 0,
      anzahlOffen: 0,
      anzahlBezahlt: 0,
      anzahlUeberfaellig: 0,
      anzahlStorniert: 0,
    };

    for (const r of rechnungen) {
      switch (r.status) {
        case 'OFFEN':
          statistik.gesamtOffen += r.betrag;
          statistik.anzahlOffen++;
          break;
        case 'BEZAHLT':
          statistik.gesamtBezahlt += r.betrag;
          statistik.anzahlBezahlt++;
          break;
        case 'UEBERFAELLIG':
          statistik.gesamtUeberfaellig += r.betrag;
          statistik.anzahlUeberfaellig++;
          break;
        case 'STORNIERT':
          statistik.gesamtStorniert += r.betrag;
          statistik.anzahlStorniert++;
          break;
      }
    }

    return statistik;
  }

  // ==================== Beitraege ====================

  /** Beitragsvorlage erstellen */
  async beitragErstellen(tenantId: string, dto: ErstelleBeitragDto) {
    return this.prisma.beitrag.create({
      data: {
        tenantId,
        name: dto.name,
        betrag: dto.betrag,
        intervall: dto.intervall,
        sportart: dto.sportart,
      },
    });
  }

  /** Alle Beitragsvorlagen abrufen */
  async beitraegeAbrufen(tenantId: string) {
    return this.prisma.beitrag.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }
}
