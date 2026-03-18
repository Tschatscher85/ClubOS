import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleEntwicklungsbogenDto } from './dto/erstelle-entwicklungsbogen.dto';

@Injectable()
export class EntwicklungService {
  constructor(private prisma: PrismaService) {}

  /** Neuen Entwicklungsbogen fuer ein Mitglied anlegen */
  async erstellen(
    tenantId: string,
    memberId: string,
    erstelltVon: string,
    dto: ErstelleEntwicklungsbogenDto,
  ) {
    // Pruefen ob Mitglied existiert
    const mitglied = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    // Pruefen ob Team existiert
    const team = await this.prisma.team.findFirst({
      where: { id: dto.teamId, tenantId },
    });

    if (!team) {
      throw new NotFoundException('Team nicht gefunden.');
    }

    return this.prisma.entwicklungsbogen.create({
      data: {
        memberId,
        teamId: dto.teamId,
        tenantId,
        erstelltVon,
        saison: dto.saison,
        ball: dto.ball,
        passen: dto.passen,
        schuss: dto.schuss,
        zweikampf: dto.zweikampf,
        kopfball: dto.kopfball,
        spielverstaendnis: dto.spielverstaendnis,
        positionsspiel: dto.positionsspiel,
        defensivverhalten: dto.defensivverhalten,
        schnelligkeit: dto.schnelligkeit,
        ausdauer: dto.ausdauer,
        sprungkraft: dto.sprungkraft,
        teamgeist: dto.teamgeist,
        einstellung: dto.einstellung,
        coaching: dto.coaching,
        staerken: dto.staerken,
        entwicklungsfelder: dto.entwicklungsfelder,
        ziele: dto.ziele,
        trainerEmpfehlung: dto.trainerEmpfehlung,
      },
      include: { member: true, team: true },
    });
  }

  /** Alle Entwicklungsboegen eines Spielers laden */
  async alleVonMitglied(tenantId: string, memberId: string) {
    return this.prisma.entwicklungsbogen.findMany({
      where: { tenantId, memberId },
      include: { team: true },
      orderBy: { datum: 'desc' },
    });
  }

  /** Trend-Daten fuer Chart (nur Bewertungen, chronologisch) */
  async trend(tenantId: string, memberId: string) {
    return this.prisma.entwicklungsbogen.findMany({
      where: { tenantId, memberId },
      select: {
        id: true,
        datum: true,
        saison: true,
        ball: true,
        passen: true,
        schuss: true,
        zweikampf: true,
        kopfball: true,
        spielverstaendnis: true,
        positionsspiel: true,
        defensivverhalten: true,
        schnelligkeit: true,
        ausdauer: true,
        sprungkraft: true,
        teamgeist: true,
        einstellung: true,
        coaching: true,
      },
      orderBy: { datum: 'asc' },
    });
  }

  /** Letzte Boegen aller Teammitglieder */
  async letzteVonTeam(tenantId: string, teamId: string) {
    // Lade alle Mitglieder des Teams
    const teamMitglieder = await this.prisma.teamMember.findMany({
      where: { teamId, team: { tenantId } },
      include: { member: true },
    });

    // Fuer jedes Mitglied den letzten Bogen laden
    const ergebnisse = await Promise.all(
      teamMitglieder.map(async (tm) => {
        const letzterBogen = await this.prisma.entwicklungsbogen.findFirst({
          where: { memberId: tm.memberId, teamId, tenantId },
          orderBy: { datum: 'desc' },
        });

        return {
          member: tm.member,
          letzterBogen,
        };
      }),
    );

    return ergebnisse;
  }

  /** Einzelnen Bogen loeschen */
  async loeschen(tenantId: string, id: string) {
    const bogen = await this.prisma.entwicklungsbogen.findFirst({
      where: { id, tenantId },
    });

    if (!bogen) {
      throw new NotFoundException('Entwicklungsbogen nicht gefunden.');
    }

    await this.prisma.entwicklungsbogen.delete({ where: { id } });

    return { geloescht: true };
  }
}
