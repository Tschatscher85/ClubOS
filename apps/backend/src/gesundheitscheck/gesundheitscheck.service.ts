import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface KategorieDetails {
  score: number;
  details: Record<string, unknown>;
}

export interface GesundheitsBericht {
  score: number;
  bewertung: 'Ausgezeichnet' | 'Gut' | 'Verbesserungswuerdig' | 'Kritisch';
  kategorien: {
    mitglieder: KategorieDetails;
    aktivitaet: KategorieDetails;
    kommunikation: KategorieDetails;
    finanzen: KategorieDetails;
  };
  empfehlungen: string[];
  zeitraum: { von: string; bis: string };
}

@Injectable()
export class GesundheitscheckService {
  constructor(private prisma: PrismaService) {}

  async analyse(tenantId: string): Promise<GesundheitsBericht> {
    const jetzt = new Date();
    const vor3Monaten = new Date(jetzt);
    vor3Monaten.setMonth(vor3Monaten.getMonth() - 3);

    const [mitglieder, aktivitaet, kommunikation, finanzen] = await Promise.all([
      this.mitgliederAnalyse(tenantId, vor3Monaten, jetzt),
      this.aktivitaetAnalyse(tenantId, vor3Monaten, jetzt),
      this.kommunikationAnalyse(tenantId, vor3Monaten, jetzt),
      this.finanzenAnalyse(tenantId, vor3Monaten, jetzt),
    ]);

    const score =
      mitglieder.score + aktivitaet.score + kommunikation.score + finanzen.score;

    const bewertung = this.berechneBewertung(score);
    const empfehlungen = this.generiereEmpfehlungen(
      mitglieder,
      aktivitaet,
      kommunikation,
      finanzen,
    );

    return {
      score,
      bewertung,
      kategorien: { mitglieder, aktivitaet, kommunikation, finanzen },
      empfehlungen,
      zeitraum: {
        von: vor3Monaten.toISOString().slice(0, 10),
        bis: jetzt.toISOString().slice(0, 10),
      },
    };
  }

  private async mitgliederAnalyse(
    tenantId: string,
    von: Date,
    bis: Date,
  ): Promise<KategorieDetails> {
    const aktiveMitglieder = await this.prisma.member.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    const neueLetzte3Monate = await this.prisma.member.count({
      where: {
        tenantId,
        joinDate: { gte: von, lte: bis },
      },
    });

    const abgaengeLetzte3Monate = await this.prisma.member.count({
      where: {
        tenantId,
        status: 'CANCELLED',
        exitDate: { gte: von, lte: bis },
      },
    });

    // Gesamt-Mitglieder vor 3 Monaten (aktiv + abgaenge - neue)
    const basisMitglieder = aktiveMitglieder - neueLetzte3Monate + abgaengeLetzte3Monate;
    const wachstumsRate =
      basisMitglieder > 0
        ? ((neueLetzte3Monate - abgaengeLetzte3Monate) / basisMitglieder) * 100
        : 0;

    let score: number;
    if (wachstumsRate > 5) score = 25;
    else if (wachstumsRate >= 0) score = 18;
    else if (wachstumsRate >= -5) score = 10;
    else score = 0;

    return {
      score,
      details: {
        aktiveMitglieder,
        neueLetzte3Monate,
        abgaengeLetzte3Monate,
        wachstumsRate: Math.round(wachstumsRate * 10) / 10,
      },
    };
  }

  private async aktivitaetAnalyse(
    tenantId: string,
    von: Date,
    bis: Date,
  ): Promise<KategorieDetails> {
    // Events im Zeitraum mit Anwesenheiten
    const events = await this.prisma.event.findMany({
      where: {
        tenantId,
        date: { gte: von, lte: bis },
      },
      include: {
        attendances: true,
        team: { select: { id: true, name: true } },
      },
    });

    // Pro Team die Anwesenheitsrate berechnen
    const teamRaten: Record<string, { name: string; ja: number; gesamt: number }> = {};

    for (const event of events) {
      const teamId = event.teamId;
      const teamName = event.team.name;

      if (!teamRaten[teamId]) {
        teamRaten[teamId] = { name: teamName, ja: 0, gesamt: 0 };
      }

      for (const a of event.attendances) {
        teamRaten[teamId].gesamt++;
        if (a.status === 'YES') {
          teamRaten[teamId].ja++;
        }
      }
    }

    const teamIds = Object.keys(teamRaten);
    let durchschnittlicheAnwesenheit = 0;
    const teamsUnter50Prozent: string[] = [];

    if (teamIds.length > 0) {
      let summeRaten = 0;
      for (const teamId of teamIds) {
        const t = teamRaten[teamId];
        const rate = t.gesamt > 0 ? (t.ja / t.gesamt) * 100 : 0;
        summeRaten += rate;
        if (rate < 50) {
          teamsUnter50Prozent.push(t.name);
        }
      }
      durchschnittlicheAnwesenheit = Math.round((summeRaten / teamIds.length) * 10) / 10;
    }

    let score: number;
    if (durchschnittlicheAnwesenheit > 75) score = 25;
    else if (durchschnittlicheAnwesenheit >= 60) score = 18;
    else if (durchschnittlicheAnwesenheit >= 40) score = 10;
    else score = 0;

    return {
      score,
      details: {
        durchschnittlicheAnwesenheit,
        teamsUnter50Prozent,
        anzahlEvents: events.length,
        anzahlTeamsMitDaten: teamIds.length,
      },
    };
  }

  private async kommunikationAnalyse(
    tenantId: string,
    von: Date,
    _bis: Date,
  ): Promise<KategorieDetails> {
    // Mitglieder mit Push-Subscriptions
    const aktiveMitglieder = await this.prisma.member.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    // User mit WebPushSubscription zaehlen (ueber tenant)
    const usersMitPush = await this.prisma.webPushSubscription.findMany({
      select: { userId: true },
      distinct: ['userId'],
      where: {
        user: { tenantId },
      },
    });
    const pushAktiviert = usersMitPush.length;
    const pushQuote =
      aktiveMitglieder > 0
        ? Math.round((pushAktiviert / aktiveMitglieder) * 1000) / 10
        : 0;

    // Nachrichten der letzten 3 Monate
    const nachrichtenLetzte3Monate = await this.prisma.message.count({
      where: {
        tenantId,
        createdAt: { gte: von },
      },
    });

    let score: number;
    if (pushQuote > 70) score = 25;
    else if (pushQuote >= 40) score = 18;
    else if (pushQuote >= 20) score = 10;
    else score = 0;

    return {
      score,
      details: {
        pushAktiviert,
        aktiveMitglieder,
        pushQuote,
        nachrichtenLetzte3Monate,
      },
    };
  }

  private async finanzenAnalyse(
    tenantId: string,
    von: Date,
    _bis: Date,
  ): Promise<KategorieDetails> {
    // Ehrenamt-Stunden gesamt
    const stundenResult = await this.prisma.uebungsleiterStunden.aggregate({
      where: { tenantId },
      _sum: { stunden: true },
    });
    const ehrenamtStundenGesamt = stundenResult._sum.stunden ?? 0;

    // Aktive Sportarten (Teams mit verschiedenen Sportarten)
    const sportarten = await this.prisma.team.findMany({
      where: { tenantId },
      select: { sport: true },
      distinct: ['sport'],
    });
    const aktiveSportarten = sportarten.length;

    // Ehrenamt-Aufgaben (abgeschlossen vs. offen)
    const ehrenamtAbgeschlossen = await this.prisma.ehrenamtAufgabe.count({
      where: { tenantId, status: 'ABGESCHLOSSEN' },
    });

    const ehrenamtGesamt = await this.prisma.ehrenamtAufgabe.count({
      where: { tenantId },
    });

    // Stunden in letzten 3 Monaten
    const stundenLetzte3 = await this.prisma.uebungsleiterStunden.aggregate({
      where: { tenantId, datum: { gte: von } },
      _sum: { stunden: true },
    });

    // Score basierend auf Datenverfuegbarkeit und Aktivitaet
    let score = 0;
    if (ehrenamtStundenGesamt > 0) score += 8;
    if (aktiveSportarten >= 3) score += 7;
    else if (aktiveSportarten >= 1) score += 4;
    if (ehrenamtAbgeschlossen > 0) score += 5;
    if ((stundenLetzte3._sum.stunden ?? 0) > 10) score += 5;

    // Max 25
    score = Math.min(score, 25);

    return {
      score,
      details: {
        ehrenamtStundenGesamt: Math.round(ehrenamtStundenGesamt * 10) / 10,
        aktiveSportarten,
        ehrenamtAufgaben: { abgeschlossen: ehrenamtAbgeschlossen, gesamt: ehrenamtGesamt },
        stundenLetzte3Monate: Math.round((stundenLetzte3._sum.stunden ?? 0) * 10) / 10,
      },
    };
  }

  private berechneBewertung(
    score: number,
  ): 'Ausgezeichnet' | 'Gut' | 'Verbesserungswuerdig' | 'Kritisch' {
    if (score >= 80) return 'Ausgezeichnet';
    if (score >= 60) return 'Gut';
    if (score >= 40) return 'Verbesserungswuerdig';
    return 'Kritisch';
  }

  private generiereEmpfehlungen(
    mitglieder: KategorieDetails,
    aktivitaet: KategorieDetails,
    kommunikation: KategorieDetails,
    finanzen: KategorieDetails,
  ): string[] {
    const empfehlungen: string[] = [];

    // Sortiere Kategorien nach Score (niedrigste zuerst)
    const kategorien = [
      { name: 'mitglieder', score: mitglieder.score, details: mitglieder.details },
      { name: 'aktivitaet', score: aktivitaet.score, details: aktivitaet.details },
      { name: 'kommunikation', score: kommunikation.score, details: kommunikation.details },
      { name: 'finanzen', score: finanzen.score, details: finanzen.details },
    ].sort((a, b) => a.score - b.score);

    for (const kat of kategorien) {
      if (empfehlungen.length >= 5) break;

      if (kat.name === 'mitglieder' && kat.score < 20) {
        if ((kat.details['wachstumsRate'] as number) < 0) {
          empfehlungen.push(
            'Die Mitgliederzahl ist ruecklaeufig. Erwaegen Sie einen Tag der offenen Tuer oder Schnuppertrainings, um neue Mitglieder zu gewinnen.',
          );
        }
        if ((kat.details['abgaengeLetzte3Monate'] as number) > 0) {
          empfehlungen.push(
            'Pruefen Sie die Kuendigungsgruende und fuehren Sie Austrittsgespraeche, um die Mitgliederbindung zu verbessern.',
          );
        }
      }

      if (kat.name === 'aktivitaet' && kat.score < 20) {
        const teams = kat.details['teamsUnter50Prozent'] as string[];
        if (teams && teams.length > 0) {
          empfehlungen.push(
            `Folgende Teams haben eine niedrige Anwesenheitsrate: ${teams.slice(0, 3).join(', ')}. Sprechen Sie die Trainer an.`,
          );
        } else {
          empfehlungen.push(
            'Die Anwesenheitsrate ist insgesamt niedrig. Ueberpruefen Sie die Trainingszeiten und -inhalte.',
          );
        }
      }

      if (kat.name === 'kommunikation' && kat.score < 20) {
        const quote = kat.details['pushQuote'] as number;
        if (quote < 30) {
          empfehlungen.push(
            'Nur wenige Mitglieder haben Push-Benachrichtigungen aktiviert. Motivieren Sie zur App-Nutzung bei der naechsten Versammlung.',
          );
        }
        if ((kat.details['nachrichtenLetzte3Monate'] as number) < 5) {
          empfehlungen.push(
            'Es werden wenige Nachrichten verschickt. Regelmaessige Updates erhoehen die Vereinsbindung.',
          );
        }
      }

      if (kat.name === 'finanzen' && kat.score < 15) {
        if ((kat.details['ehrenamtStundenGesamt'] as number) === 0) {
          empfehlungen.push(
            'Beginnen Sie mit der Erfassung von Uebungsleiterstunden, um die Ehrenamtspauschale (3.300 EUR) optimal zu nutzen.',
          );
        }
        if ((kat.details['aktiveSportarten'] as number) < 2) {
          empfehlungen.push(
            'Erwaegen Sie, weitere Sportarten anzubieten, um den Verein breiter aufzustellen.',
          );
        }
      }
    }

    // Mindestens 3 Empfehlungen
    if (empfehlungen.length < 3) {
      if (!empfehlungen.some((e) => e.includes('Anwesenheit'))) {
        empfehlungen.push(
          'Nutzen Sie die QR-Code-Check-In-Funktion, um die Anwesenheitserfassung zu vereinfachen.',
        );
      }
      if (!empfehlungen.some((e) => e.includes('Push'))) {
        empfehlungen.push(
          'Erinnern Sie Mitglieder regelmaessig an die Push-Benachrichtigungen fuer wichtige Vereins-Updates.',
        );
      }
      if (!empfehlungen.some((e) => e.includes('Ehrenamt'))) {
        empfehlungen.push(
          'Erfassen Sie ehrenamtliche Taetigkeiten im Ehrenamt-Modul, um freiwilliges Engagement sichtbar zu machen.',
        );
      }
    }

    return empfehlungen.slice(0, 5);
  }
}
