import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KiService } from '../ki/ki.service';

// ==================== Interfaces ====================

interface MitgliedTeam {
  id: string;
  name: string;
}

interface RisikoFaktorAnwesenheit {
  score: number;
  details: string;
}

interface RisikoFaktorInaktivitaet {
  score: number;
  letzteAnwesenheit: string | null;
}

interface RisikoFaktorAlter {
  score: number;
  alter: number | null;
}

interface RisikoFaktorBeitrag {
  score: number;
  details: string;
}

export interface MitgliedRisiko {
  mitglied: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    teams: MitgliedTeam[];
  };
  score: number;
  ampel: 'gruen' | 'gelb' | 'rot';
  faktoren: {
    anwesenheit: RisikoFaktorAnwesenheit;
    inaktivitaet: RisikoFaktorInaktivitaet;
    alter: RisikoFaktorAlter;
    beitrag: RisikoFaktorBeitrag;
  };
  vorschlag?: string;
}

// ==================== Service ====================

@Injectable()
export class MitgliederbindungService {
  private readonly logger = new Logger(MitgliederbindungService.name);

  constructor(
    private prisma: PrismaService,
    private kiService: KiService,
  ) {}

  /**
   * Analysiert alle aktiven Mitglieder eines Vereins und berechnet
   * einen Risiko-Score fuer Kuendigungsgefahr (Churn Prevention).
   */
  async risikoAnalyse(tenantId: string): Promise<MitgliedRisiko[]> {
    const jetzt = new Date();
    const achtWochenZurueck = new Date(jetzt);
    achtWochenZurueck.setDate(achtWochenZurueck.getDate() - 56);

    // Alle aktiven Mitglieder mit Teams laden
    const mitglieder = await this.prisma.member.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        teamMembers: {
          select: {
            team: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (mitglieder.length === 0) {
      return [];
    }

    const mitgliedIds = mitglieder.map((m) => m.id);

    // Alle Anwesenheiten der letzten 8 Wochen laden
    const anwesenheiten = await this.prisma.attendance.findMany({
      where: {
        memberId: { in: mitgliedIds },
        event: {
          tenantId,
          date: { gte: achtWochenZurueck, lte: jetzt },
        },
      },
      select: {
        memberId: true,
        status: true,
        event: {
          select: { date: true },
        },
      },
    });

    // Letzte Zusage (YES) pro Mitglied finden
    const letzteZusagen = await this.prisma.attendance.findMany({
      where: {
        memberId: { in: mitgliedIds },
        status: 'YES',
        event: { tenantId },
      },
      orderBy: { event: { date: 'desc' } },
      select: {
        memberId: true,
        event: { select: { date: true } },
      },
    });

    // Map: memberId -> letzte Zusage-Datum
    const letzteZusageMap = new Map<string, Date>();
    for (const z of letzteZusagen) {
      if (!letzteZusageMap.has(z.memberId)) {
        letzteZusageMap.set(z.memberId, z.event.date);
      }
    }

    // Map: memberId -> Anwesenheiten letzte 8 Wochen
    const anwesenheitMap = new Map<string, { gesamt: number; zugesagt: number }>();
    for (const a of anwesenheiten) {
      const aktuell = anwesenheitMap.get(a.memberId) || { gesamt: 0, zugesagt: 0 };
      aktuell.gesamt++;
      if (a.status === 'YES') {
        aktuell.zugesagt++;
      }
      anwesenheitMap.set(a.memberId, aktuell);
    }

    // Offene Rechnungen pro Mitglied laden (fuer Beitragsstatus)
    let offeneRechnungenMap = new Map<string, number>();
    try {
      const offeneRechnungen = await this.prisma.rechnung.findMany({
        where: {
          tenantId,
          memberId: { in: mitgliedIds },
          status: { in: ['OFFEN', 'UEBERFAELLIG'] },
        },
        select: {
          memberId: true,
          faelligAm: true,
        },
      });

      for (const r of offeneRechnungen) {
        const monateUeberfaellig = Math.floor(
          (jetzt.getTime() - new Date(r.faelligAm).getTime()) / (1000 * 60 * 60 * 24 * 30),
        );
        const aktuell = offeneRechnungenMap.get(r.memberId) || 0;
        if (monateUeberfaellig > aktuell) {
          offeneRechnungenMap.set(r.memberId, monateUeberfaellig);
        }
      }
    } catch {
      // Rechnungs-Tabelle existiert nicht oder Fehler - graceful ignorieren
      this.logger.debug('Rechnungsdaten nicht verfuegbar, Beitragsstatus wird uebersprungen');
      offeneRechnungenMap = new Map();
    }

    // Risiko-Score fuer jedes Mitglied berechnen
    const ergebnisse: MitgliedRisiko[] = mitglieder.map((mitglied) => {
      const teams = mitglied.teamMembers.map((tm) => ({
        id: tm.team.id,
        name: tm.team.name,
      }));

      // 1. Anwesenheit (0-25)
      const anwDaten = anwesenheitMap.get(mitglied.id);
      const anwesenheitScore = this.berechneAnwesenheitScore(anwDaten);

      // 2. Inaktivitaet (0-25)
      const letzteZusage = letzteZusageMap.get(mitglied.id) || null;
      const inaktivitaetScore = this.berechneInaktivitaetScore(letzteZusage, jetzt);

      // 3. Alter (0-25)
      const alter = mitglied.birthDate
        ? Math.floor((jetzt.getTime() - new Date(mitglied.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : null;
      const alterScore = this.berechneAlterScore(alter);

      // 4. Beitragsstatus (0-25)
      const monateUeberfaellig = offeneRechnungenMap.get(mitglied.id) || 0;
      const beitragScore = this.berechneBeitragScore(monateUeberfaellig);

      const gesamtScore = Math.min(
        100,
        anwesenheitScore.score + inaktivitaetScore.score + alterScore.score + beitragScore.score,
      );

      const ampel: 'gruen' | 'gelb' | 'rot' =
        gesamtScore > 60 ? 'rot' : gesamtScore >= 30 ? 'gelb' : 'gruen';

      return {
        mitglied: {
          id: mitglied.id,
          firstName: mitglied.firstName,
          lastName: mitglied.lastName,
          birthDate: mitglied.birthDate ? mitglied.birthDate.toISOString() : null,
          teams,
        },
        score: gesamtScore,
        ampel,
        faktoren: {
          anwesenheit: anwesenheitScore,
          inaktivitaet: {
            score: inaktivitaetScore.score,
            letzteAnwesenheit: letzteZusage ? letzteZusage.toISOString() : null,
          },
          alter: {
            score: alterScore.score,
            alter,
          },
          beitrag: beitragScore,
        },
      };
    });

    // Nach Score absteigend sortieren
    ergebnisse.sort((a, b) => b.score - a.score);

    return ergebnisse;
  }

  /**
   * Generiert einen persoenlichen Kontakt-Vorschlag fuer ein Mitglied
   * mithilfe der KI-Funktion.
   */
  async kontaktVorschlag(tenantId: string, mitgliedId: string): Promise<{ vorschlag: string }> {
    // Mitglied laden
    const mitglied = await this.prisma.member.findFirst({
      where: { id: mitgliedId, tenantId, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        teamMembers: {
          select: {
            team: { select: { name: true } },
          },
        },
      },
    });

    if (!mitglied) {
      throw new Error('Mitglied nicht gefunden.');
    }

    // Risiko-Daten fuer dieses Mitglied berechnen
    const alleRisiken = await this.risikoAnalyse(tenantId);
    const risiko = alleRisiken.find((r) => r.mitglied.id === mitgliedId);

    const alter = mitglied.birthDate
      ? Math.floor((Date.now() - new Date(mitglied.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      : null;

    const teams = mitglied.teamMembers.map((tm) => tm.team.name).join(', ') || 'Kein Team';

    const systemPrompt =
      'Du bist ein Vereinsberater. Erstelle einen kurzen, persoenlichen Kontakt-Text fuer einen Trainer, ' +
      'der ein Mitglied ansprechen soll das Gefahr laeuft den Verein zu verlassen. ' +
      'Der Text soll empathisch, motivierend und konkret sein. Maximal 2-3 Saetze. Duze das Mitglied.';

    const userPrompt = [
      `Mitglied: ${mitglied.firstName} ${mitglied.lastName}`,
      alter !== null ? `Alter: ${alter} Jahre` : null,
      `Teams: ${teams}`,
      risiko
        ? `Risiko-Score: ${risiko.score}/100 (${risiko.ampel})`
        : null,
      risiko?.faktoren.inaktivitaet.letzteAnwesenheit
        ? `Letzte Anwesenheit: ${new Date(risiko.faktoren.inaktivitaet.letzteAnwesenheit).toLocaleDateString('de-DE')}`
        : 'Keine Anwesenheit in letzter Zeit',
      risiko
        ? `Hauptfaktoren: Anwesenheitsrate (${risiko.faktoren.anwesenheit.details}), Inaktivitaet (${risiko.faktoren.inaktivitaet.score}/25 Punkte)`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const antwort = await this.kiService.textGenerieren(tenantId, systemPrompt, userPrompt);
      return { vorschlag: antwort.text };
    } catch (error) {
      this.logger.warn(`KI-Vorschlag fehlgeschlagen fuer Mitglied ${mitgliedId}: ${error}`);
      // Fallback ohne KI
      return {
        vorschlag: `Sprich ${mitglied.firstName} persoenlich an und erkundige dich, wie es ihm/ihr geht. ` +
          `Frage nach den Gruenden fuer die Abwesenheit und zeige Verstaendnis. ` +
          `Lade ${mitglied.firstName} aktiv zum naechsten Training ein.`,
      };
    }
  }

  // ==================== Score-Berechnung ====================

  private berechneAnwesenheitScore(daten: { gesamt: number; zugesagt: number } | undefined): RisikoFaktorAnwesenheit {
    if (!daten || daten.gesamt === 0) {
      return { score: 25, details: 'Keine Events in den letzten 8 Wochen' };
    }

    const rate = (daten.zugesagt / daten.gesamt) * 100;

    if (rate >= 75) {
      return { score: 0, details: `${Math.round(rate)}% Anwesenheit (${daten.zugesagt}/${daten.gesamt})` };
    }
    if (rate >= 50) {
      return { score: 10, details: `${Math.round(rate)}% Anwesenheit (${daten.zugesagt}/${daten.gesamt})` };
    }
    if (rate >= 25) {
      return { score: 18, details: `${Math.round(rate)}% Anwesenheit (${daten.zugesagt}/${daten.gesamt})` };
    }
    return { score: 25, details: `${Math.round(rate)}% Anwesenheit (${daten.zugesagt}/${daten.gesamt})` };
  }

  private berechneInaktivitaetScore(
    letzteZusage: Date | null,
    jetzt: Date,
  ): { score: number; wochen: number | null } {
    if (!letzteZusage) {
      return { score: 25, wochen: null };
    }

    const diffMs = jetzt.getTime() - letzteZusage.getTime();
    const wochen = diffMs / (1000 * 60 * 60 * 24 * 7);

    if (wochen < 2) return { score: 0, wochen: Math.round(wochen * 10) / 10 };
    if (wochen < 4) return { score: 8, wochen: Math.round(wochen * 10) / 10 };
    if (wochen < 8) return { score: 18, wochen: Math.round(wochen * 10) / 10 };
    return { score: 25, wochen: Math.round(wochen * 10) / 10 };
  }

  private berechneAlterScore(alter: number | null): { score: number } {
    if (alter === null) return { score: 5 };

    if (alter >= 16 && alter <= 18) return { score: 15 };
    if (alter >= 27 && alter <= 35) return { score: 20 };
    if (alter > 35 && alter <= 45) return { score: 15 };
    return { score: 5 };
  }

  private berechneBeitragScore(monateUeberfaellig: number): RisikoFaktorBeitrag {
    if (monateUeberfaellig <= 0) {
      return { score: 0, details: 'Beitraege bezahlt' };
    }
    if (monateUeberfaellig === 1) {
      return { score: 10, details: '1 Monat ueberfaellig' };
    }
    return { score: 25, details: `${monateUeberfaellig} Monate ueberfaellig` };
  }
}
