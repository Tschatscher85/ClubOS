import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ErstelleBeitragsklasseDto,
  AktualisiereBeitragsklasseDto,
  ZuweiseBeitragsklasseDto,
} from './dto/erstelle-beitragsklasse.dto';

export interface SportartUebersicht {
  sportart: string;
  mitglieder: number;
  monatsSoll: number;
}

export interface KlassenUebersicht {
  klasse: string;
  mitglieder: number;
  betrag: number;
  monatsSoll: number;
}

export interface BeitragsUebersicht {
  monatsSoll: number;
  jahresSoll: number;
  anzahlMitglieder: number;
  anzahlOhneBeitrag: number;
  nachSportart: SportartUebersicht[];
  nachKlasse: KlassenUebersicht[];
}

/** Berechnet den Monatsbetrag basierend auf dem Intervall */
function berechneMonatsBetrag(betrag: number, intervall: string): number {
  switch (intervall) {
    case 'MONATLICH':
      return betrag;
    case 'QUARTALSWEISE':
      return betrag / 3;
    case 'HALBJAEHRLICH':
      return betrag / 6;
    case 'JAEHRLICH':
      return betrag / 12;
    default:
      return betrag;
  }
}

@Injectable()
export class BeitragService {
  constructor(private prisma: PrismaService) {}

  /** Alle Beitragsklassen des Vereins abrufen */
  async alleAbrufen(tenantId: string) {
    return this.prisma.beitragsklasse.findMany({
      where: { tenantId },
      orderBy: [{ sortierung: 'asc' }, { name: 'asc' }],
    });
  }

  /** Neue Beitragsklasse erstellen */
  async erstellen(tenantId: string, dto: ErstelleBeitragsklasseDto) {
    return this.prisma.beitragsklasse.create({
      data: {
        tenantId,
        name: dto.name,
        beschreibung: dto.beschreibung,
        betrag: dto.betrag,
        intervall: dto.intervall || 'MONATLICH',
        sportarten: dto.sportarten || [],
        altersVon: dto.altersVon ?? null,
        altersBis: dto.altersBis ?? null,
        istAktiv: dto.istAktiv ?? true,
        sortierung: dto.sortierung ?? 0,
      },
    });
  }

  /** Beitragsklasse aktualisieren */
  async aktualisieren(tenantId: string, id: string, dto: AktualisiereBeitragsklasseDto) {
    const klasse = await this.prisma.beitragsklasse.findFirst({
      where: { id, tenantId },
    });

    if (!klasse) {
      throw new NotFoundException('Beitragsklasse nicht gefunden.');
    }

    return this.prisma.beitragsklasse.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
        ...(dto.betrag !== undefined && { betrag: dto.betrag }),
        ...(dto.intervall !== undefined && { intervall: dto.intervall }),
        ...(dto.sportarten !== undefined && { sportarten: dto.sportarten }),
        ...(dto.altersVon !== undefined && { altersVon: dto.altersVon }),
        ...(dto.altersBis !== undefined && { altersBis: dto.altersBis }),
        ...(dto.istAktiv !== undefined && { istAktiv: dto.istAktiv }),
        ...(dto.sortierung !== undefined && { sortierung: dto.sortierung }),
      },
    });
  }

  /** Beitragsklasse loeschen */
  async loeschen(tenantId: string, id: string) {
    const klasse = await this.prisma.beitragsklasse.findFirst({
      where: { id, tenantId },
    });

    if (!klasse) {
      throw new NotFoundException('Beitragsklasse nicht gefunden.');
    }

    // Mitglieder die diese Klasse haben: beitragsklasseId auf null setzen
    await this.prisma.member.updateMany({
      where: { tenantId, beitragsklasseId: id },
      data: { beitragsklasseId: null },
    });

    return this.prisma.beitragsklasse.delete({ where: { id } });
  }

  /** Beitragsklasse einem Mitglied zuweisen */
  async zuweisen(tenantId: string, dto: ZuweiseBeitragsklasseDto) {
    const mitglied = await this.prisma.member.findFirst({
      where: { id: dto.memberId, tenantId },
    });

    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    if (dto.beitragsklasseId) {
      const klasse = await this.prisma.beitragsklasse.findFirst({
        where: { id: dto.beitragsklasseId, tenantId },
      });

      if (!klasse) {
        throw new NotFoundException('Beitragsklasse nicht gefunden.');
      }
    }

    return this.prisma.member.update({
      where: { id: dto.memberId },
      data: { beitragsklasseId: dto.beitragsklasseId || null },
    });
  }

  /** Beitrags-Uebersicht berechnen (Soll vs Ist pro Monat) */
  async uebersicht(tenantId: string): Promise<BeitragsUebersicht> {
    const [mitglieder, klassen] = await Promise.all([
      this.prisma.member.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: {
          id: true,
          beitragsklasseId: true,
          beitragsArt: true,
          beitragBetrag: true,
          beitragIntervall: true,
          ermaessigungProzent: true,
          sport: true,
        },
      }),
      this.prisma.beitragsklasse.findMany({
        where: { tenantId, istAktiv: true },
      }),
    ]);

    const klassenMap = new Map(klassen.map((k) => [k.id, k]));

    let monatsSoll = 0;
    let anzahlOhneBeitrag = 0;
    const sportartSummen = new Map<string, { mitglieder: number; monatsSoll: number }>();
    const klassenSummen = new Map<string, { klasse: string; mitglieder: number; betrag: number; monatsSoll: number }>();

    for (const m of mitglieder) {
      let monatsBeitrag = 0;
      let hatBeitrag = false;
      let klassenName = '';

      // 1. Beitragsklasse pruefen
      if (m.beitragsklasseId && klassenMap.has(m.beitragsklasseId)) {
        const klasse = klassenMap.get(m.beitragsklasseId)!;
        monatsBeitrag = berechneMonatsBetrag(klasse.betrag, klasse.intervall);
        hatBeitrag = true;
        klassenName = klasse.name;
      }
      // 2. Individueller Beitrag
      else if (m.beitragBetrag && m.beitragBetrag > 0) {
        monatsBeitrag = berechneMonatsBetrag(
          m.beitragBetrag,
          m.beitragIntervall || 'MONATLICH',
        );
        hatBeitrag = true;
        klassenName = m.beitragsArt || 'Individuell';
      }

      if (!hatBeitrag) {
        anzahlOhneBeitrag++;
        continue;
      }

      // Ermaessigung anwenden
      if (m.ermaessigungProzent && m.ermaessigungProzent > 0) {
        monatsBeitrag = monatsBeitrag * (1 - m.ermaessigungProzent / 100);
      }

      monatsSoll += monatsBeitrag;

      // Nach Sportart aufschluesseln
      for (const sportart of m.sport) {
        const bisherSport = sportartSummen.get(sportart) || { mitglieder: 0, monatsSoll: 0 };
        bisherSport.mitglieder++;
        bisherSport.monatsSoll += monatsBeitrag / m.sport.length; // Anteilig aufteilen
        sportartSummen.set(sportart, bisherSport);
      }

      // Nach Klasse aufschluesseln
      if (klassenName) {
        const bisherKlasse = klassenSummen.get(klassenName) || {
          klasse: klassenName,
          mitglieder: 0,
          betrag: monatsBeitrag,
          monatsSoll: 0,
        };
        bisherKlasse.mitglieder++;
        bisherKlasse.monatsSoll += monatsBeitrag;
        klassenSummen.set(klassenName, bisherKlasse);
      }
    }

    // Runden auf 2 Dezimalstellen
    const rundeMonatsSoll = Math.round(monatsSoll * 100) / 100;

    return {
      monatsSoll: rundeMonatsSoll,
      jahresSoll: Math.round(rundeMonatsSoll * 12 * 100) / 100,
      anzahlMitglieder: mitglieder.length,
      anzahlOhneBeitrag,
      nachSportart: Array.from(sportartSummen.entries()).map(([sportart, daten]) => ({
        sportart,
        mitglieder: daten.mitglieder,
        monatsSoll: Math.round(daten.monatsSoll * 100) / 100,
      })),
      nachKlasse: Array.from(klassenSummen.values()).map((k) => ({
        klasse: k.klasse,
        mitglieder: k.mitglieder,
        betrag: Math.round(k.betrag * 100) / 100,
        monatsSoll: Math.round(k.monatsSoll * 100) / 100,
      })),
    };
  }
}
