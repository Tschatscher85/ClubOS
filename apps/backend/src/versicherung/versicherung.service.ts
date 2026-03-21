import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface VorhandeneVersicherung {
  typ: string;
  anbieter: string | null;
  policeNr: string | null;
  gueltigBis: Date | null;
  status: 'aktiv' | 'laeuft_bald_ab' | 'abgelaufen' | 'unbekannt';
}

export interface Empfehlung {
  typ: string;
  grund: string;
  prioritaet: 'hoch' | 'mittel' | 'niedrig';
  geschaetzteKosten?: string;
}

export interface Warnung {
  typ: string;
  nachricht: string;
}

export interface VersicherungsCheckErgebnis {
  vorhandeneVersicherungen: VorhandeneVersicherung[];
  empfehlungen: Empfehlung[];
  warnungen: Warnung[];
}

@Injectable()
export class VersicherungService {
  private readonly logger = new Logger(VersicherungService.name);

  constructor(private prisma: PrismaService) {}

  async check(tenantId: string): Promise<VersicherungsCheckErgebnis> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return { vorhandeneVersicherungen: [], empfehlungen: [], warnungen: [] };
    }

    const jetzt = new Date();
    const in30Tagen = new Date(jetzt.getTime() + 30 * 24 * 60 * 60 * 1000);

    // ==================== Vorhandene Versicherungen ====================

    const vorhandeneVersicherungen: VorhandeneVersicherung[] = [];

    // Haftpflichtversicherung
    if (tenant.haftpflichtVersicherung) {
      const status = this.ermittleStatus(tenant.haftpflichtGueltigBis, jetzt);
      vorhandeneVersicherungen.push({
        typ: 'Vereinshaftpflicht',
        anbieter: tenant.haftpflichtVersicherung,
        policeNr: tenant.haftpflichtPoliceNr,
        gueltigBis: tenant.haftpflichtGueltigBis,
        status,
      });
    }

    // Unfallversicherung
    if (tenant.unfallVersicherung) {
      const status = this.ermittleStatus(tenant.unfallGueltigBis, jetzt);
      vorhandeneVersicherungen.push({
        typ: 'Sport-Unfallversicherung',
        anbieter: tenant.unfallVersicherung,
        policeNr: tenant.unfallPoliceNr,
        gueltigBis: tenant.unfallGueltigBis,
        status,
      });
    }

    // D&O Versicherung
    if (tenant.gewaehrleistungsVersicherung) {
      vorhandeneVersicherungen.push({
        typ: 'D&O / Vermoegens­schaden­haftpflicht',
        anbieter: tenant.gewaehrleistungsVersicherung,
        policeNr: null,
        gueltigBis: null,
        status: 'aktiv',
      });
    }

    // ==================== Daten sammeln ====================

    const aktiveMitglieder = await this.prisma.member.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    const u18Mitglieder = await this.prisma.member.count({
      where: {
        tenantId,
        status: 'ACTIVE',
        birthDate: { gt: new Date(jetzt.getFullYear() - 18, jetzt.getMonth(), jetzt.getDate()) },
      },
    });

    const jahresBeginn = new Date(jetzt.getFullYear(), 0, 1);
    const eventsImJahr = await this.prisma.event.count({
      where: {
        tenantId,
        date: { gte: jahresBeginn },
      },
    });

    const ehrenamtAufgaben = await this.prisma.ehrenamtAufgabe.count({
      where: { tenantId },
    });

    // ==================== Empfehlungen ====================

    const empfehlungen: Empfehlung[] = [];

    // Haftpflicht
    if (!tenant.haftpflichtVersicherung) {
      let kosten = '150-300 EUR/Jahr';
      if (aktiveMitglieder > 500) kosten = '300-600 EUR/Jahr';
      if (aktiveMitglieder > 1000) kosten = '600-1.200 EUR/Jahr';

      empfehlungen.push({
        typ: 'Vereinshaftpflicht',
        grund: `Ihr Verein hat ${aktiveMitglieder} aktive Mitglieder. Eine Vereinshaftpflicht ist fuer jeden Verein essenziell.`,
        prioritaet: 'hoch',
        geschaetzteKosten: kosten,
      });
    }

    // Unfallversicherung
    if (!tenant.unfallVersicherung) {
      empfehlungen.push({
        typ: 'Sport-Unfallversicherung',
        grund: `${aktiveMitglieder} aktive Mitglieder sind nicht gegen Sportunfaelle versichert. Besonders im Vereinssport wichtig.`,
        prioritaet: 'hoch',
        geschaetzteKosten: aktiveMitglieder > 200 ? '500-1.000 EUR/Jahr' : '200-500 EUR/Jahr',
      });
    }

    // Jugend-Unfallversicherung
    if (u18Mitglieder > 0 && !tenant.unfallVersicherung) {
      empfehlungen.push({
        typ: 'Jugend-Unfallversicherung',
        grund: `${u18Mitglieder} Mitglieder unter 18 Jahren aktiv. Fuer Jugendliche besteht eine erhoehte Fuersorgepflicht.`,
        prioritaet: 'hoch',
        geschaetzteKosten: '100-300 EUR/Jahr',
      });
    }

    // Veranstaltungsversicherung
    if (eventsImJahr > 10) {
      empfehlungen.push({
        typ: 'Veranstaltungsversicherung',
        grund: `${eventsImJahr} Veranstaltungen in diesem Jahr. Ab ca. 10 Events pro Jahr empfiehlt sich eine Rahmenversicherung.`,
        prioritaet: 'mittel',
        geschaetzteKosten: '200-500 EUR/Jahr',
      });
    }

    // D&O Versicherung
    if (ehrenamtAufgaben > 0 && !tenant.gewaehrleistungsVersicherung) {
      empfehlungen.push({
        typ: 'D&O Versicherung (Vermoegens­schaden­haftpflicht)',
        grund: `Ihr Verein nutzt das Ehrenamt-Modul mit ${ehrenamtAufgaben} Aufgaben. Vorstands- und Ehrenamtstraeger sollten gegen Vermoegens­schaeden abgesichert sein.`,
        prioritaet: 'mittel',
        geschaetzteKosten: '100-300 EUR/Jahr',
      });
    }

    // Rechtsschutz fuer groessere Vereine
    if (aktiveMitglieder > 200) {
      empfehlungen.push({
        typ: 'Vereins-Rechtsschutz',
        grund: `Mit ${aktiveMitglieder} Mitgliedern koennen rechtliche Streitigkeiten kostspielig werden. Eine Rechtsschutzversicherung schuetzt den Verein.`,
        prioritaet: 'niedrig',
        geschaetzteKosten: '200-500 EUR/Jahr',
      });
    }

    // ==================== Warnungen ====================

    const warnungen: Warnung[] = [];

    // Haftpflicht laeuft bald ab
    if (tenant.haftpflichtGueltigBis && tenant.haftpflichtGueltigBis <= in30Tagen) {
      if (tenant.haftpflichtGueltigBis < jetzt) {
        warnungen.push({
          typ: 'Haftpflicht',
          nachricht: `Ihre Vereinshaftpflicht ist am ${tenant.haftpflichtGueltigBis.toLocaleDateString('de-DE')} abgelaufen! Bitte erneuern Sie diese umgehend.`,
        });
      } else {
        warnungen.push({
          typ: 'Haftpflicht',
          nachricht: `Ihre Vereinshaftpflicht laeuft am ${tenant.haftpflichtGueltigBis.toLocaleDateString('de-DE')} ab. Bitte erneuern Sie rechtzeitig.`,
        });
      }
    }

    // Unfallversicherung laeuft bald ab
    if (tenant.unfallGueltigBis && tenant.unfallGueltigBis <= in30Tagen) {
      if (tenant.unfallGueltigBis < jetzt) {
        warnungen.push({
          typ: 'Unfallversicherung',
          nachricht: `Ihre Sport-Unfallversicherung ist am ${tenant.unfallGueltigBis.toLocaleDateString('de-DE')} abgelaufen! Bitte erneuern Sie diese umgehend.`,
        });
      } else {
        warnungen.push({
          typ: 'Unfallversicherung',
          nachricht: `Ihre Sport-Unfallversicherung laeuft am ${tenant.unfallGueltigBis.toLocaleDateString('de-DE')} ab. Bitte erneuern Sie rechtzeitig.`,
        });
      }
    }

    // Gemeinnuetzigkeitsbescheid
    if (tenant.gemeinnuetzigBis && tenant.gemeinnuetzigBis <= in30Tagen) {
      warnungen.push({
        typ: 'Gemeinnuetzigkeit',
        nachricht: `Ihr Freistellungsbescheid (Gemeinnuetzigkeit) laeuft am ${tenant.gemeinnuetzigBis.toLocaleDateString('de-DE')} ab. Ohne gueltigen Bescheid verlieren Sie den Gemeinnuetzigkeitsstatus.`,
      });
    }

    return { vorhandeneVersicherungen, empfehlungen, warnungen };
  }

  private ermittleStatus(
    gueltigBis: Date | null,
    jetzt: Date,
  ): 'aktiv' | 'laeuft_bald_ab' | 'abgelaufen' | 'unbekannt' {
    if (!gueltigBis) return 'unbekannt';
    if (gueltigBis < jetzt) return 'abgelaufen';
    const in30Tagen = new Date(jetzt.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (gueltigBis <= in30Tagen) return 'laeuft_bald_ab';
    return 'aktiv';
  }
}
