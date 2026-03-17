import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ErstelleTurnierDto,
  AktualisiereTurnierDto,
  ErstelleSpielDto,
  AktualisiereSpielDto,
} from './dto/erstelle-turnier.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class TournamentService {
  constructor(private prisma: PrismaService) {}

  async erstellen(tenantId: string, dto: ErstelleTurnierDto) {
    const publicUrl = randomBytes(8).toString('hex');

    return this.prisma.tournament.create({
      data: {
        name: dto.name,
        sport: dto.sportart,
        format: dto.format,
        publicUrl,
        tenantId,
      },
      include: { matches: true },
    });
  }

  async alleAbrufen(tenantId: string) {
    return this.prisma.tournament.findMany({
      where: { tenantId },
      include: {
        _count: { select: { matches: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async nachIdAbrufen(tenantId: string, id: string) {
    const turnier = await this.prisma.tournament.findFirst({
      where: { id, tenantId },
      include: {
        matches: { orderBy: { time: 'asc' } },
      },
    });

    if (!turnier) {
      throw new NotFoundException('Turnier nicht gefunden.');
    }

    return turnier;
  }

  /**
   * Oeffentlicher Zugriff ueber publicUrl (kein Auth noetig)
   */
  async nachPublicUrl(publicUrl: string) {
    const turnier = await this.prisma.tournament.findUnique({
      where: { publicUrl },
      include: {
        matches: { orderBy: { time: 'asc' } },
      },
    });

    if (!turnier) {
      throw new NotFoundException('Turnier nicht gefunden.');
    }

    // Tabelle berechnen
    const tabelle = this.tabelleBerechnen(turnier.matches);

    return { ...turnier, tabelle };
  }

  async aktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisiereTurnierDto,
  ) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.tournament.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.format !== undefined && { format: dto.format }),
      },
    });
  }

  async liveSchalten(tenantId: string, id: string, isLive: boolean) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.tournament.update({
      where: { id },
      data: { isLive },
    });
  }

  async loeschen(tenantId: string, id: string) {
    await this.nachIdAbrufen(tenantId, id);
    return this.prisma.tournament.delete({ where: { id } });
  }

  // ==================== Spiele ====================

  async spielHinzufuegen(tenantId: string, turnierId: string, dto: ErstelleSpielDto) {
    await this.nachIdAbrufen(tenantId, turnierId);

    return this.prisma.tournamentMatch.create({
      data: {
        tournamentId: turnierId,
        team1: dto.team1,
        team2: dto.team2,
        time: dto.zeit ? new Date(dto.zeit) : null,
        field: dto.feld,
      },
    });
  }

  async spielAktualisieren(
    tenantId: string,
    turnierId: string,
    spielId: string,
    dto: AktualisiereSpielDto,
  ) {
    await this.nachIdAbrufen(tenantId, turnierId);

    return this.prisma.tournamentMatch.update({
      where: { id: spielId },
      data: {
        ...(dto.score1 !== undefined && { score1: dto.score1 }),
        ...(dto.score2 !== undefined && { score2: dto.score2 }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.zeit !== undefined && { time: new Date(dto.zeit) }),
        ...(dto.feld !== undefined && { field: dto.feld }),
      },
    });
  }

  async spielLoeschen(tenantId: string, turnierId: string, spielId: string) {
    await this.nachIdAbrufen(tenantId, turnierId);
    return this.prisma.tournamentMatch.delete({ where: { id: spielId } });
  }

  // ==================== Tabelle ====================

  private tabelleBerechnen(
    spiele: Array<{
      team1: string;
      team2: string;
      score1: number | null;
      score2: number | null;
      status: string;
    }>,
  ) {
    const teams = new Map<
      string,
      {
        name: string;
        spiele: number;
        siege: number;
        unentschieden: number;
        niederlagen: number;
        tore: number;
        gegentore: number;
        punkte: number;
      }
    >();

    const getTeam = (name: string) => {
      if (!teams.has(name)) {
        teams.set(name, {
          name,
          spiele: 0,
          siege: 0,
          unentschieden: 0,
          niederlagen: 0,
          tore: 0,
          gegentore: 0,
          punkte: 0,
        });
      }
      return teams.get(name)!;
    };

    for (const spiel of spiele) {
      if (spiel.status !== 'BEENDET' || spiel.score1 === null || spiel.score2 === null) {
        // Auch nicht-beendete Teams in Tabelle aufnehmen
        getTeam(spiel.team1);
        getTeam(spiel.team2);
        continue;
      }

      const t1 = getTeam(spiel.team1);
      const t2 = getTeam(spiel.team2);

      t1.spiele++;
      t2.spiele++;
      t1.tore += spiel.score1;
      t1.gegentore += spiel.score2;
      t2.tore += spiel.score2;
      t2.gegentore += spiel.score1;

      if (spiel.score1 > spiel.score2) {
        t1.siege++;
        t1.punkte += 3;
        t2.niederlagen++;
      } else if (spiel.score1 < spiel.score2) {
        t2.siege++;
        t2.punkte += 3;
        t1.niederlagen++;
      } else {
        t1.unentschieden++;
        t2.unentschieden++;
        t1.punkte += 1;
        t2.punkte += 1;
      }
    }

    return Array.from(teams.values()).sort((a, b) => {
      if (b.punkte !== a.punkte) return b.punkte - a.punkte;
      const diffA = a.tore - a.gegentore;
      const diffB = b.tore - b.gegentore;
      if (diffB !== diffA) return diffB - diffA;
      return b.tore - a.tore;
    });
  }
}
