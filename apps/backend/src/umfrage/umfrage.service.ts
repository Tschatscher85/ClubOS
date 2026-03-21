import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleUmfrageDto } from './dto/umfrage.dto';

interface UmfrageTokenPayload {
  umfrageId: string;
  tenantId: string;
}

@Injectable()
export class UmfrageService {
  private readonly jwtSecret: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('jwt.secret') || 'dev-jwt-secret';
  }

  /** Umfrage erstellen + Token generieren */
  async erstellen(tenantId: string, userId: string, dto: ErstelleUmfrageDto) {
    const umfrage = await this.prisma.umfrage.create({
      data: {
        tenantId,
        erstelltVon: userId,
        frage: dto.frage,
        optionen: dto.optionen,
        teamId: dto.teamId || null,
        abteilungId: dto.abteilungId || null,
        endetAm: dto.endetAm ? new Date(dto.endetAm) : null,
      },
      include: {
        team: { select: { id: true, name: true } },
        abteilung: { select: { id: true, name: true } },
        antworten: true,
      },
    });

    // Token generieren (7 Tage gueltig)
    const token = jwt.sign(
      { umfrageId: umfrage.id, tenantId } as UmfrageTokenPayload,
      this.jwtSecret,
      { expiresIn: '7d' },
    );

    return { ...umfrage, token };
  }

  /** Alle Umfragen eines Vereins abrufen (rollenbasiert gefiltert) */
  async alleAbrufen(tenantId: string, userId?: string, rolle?: string) {
    // ADMIN/SUPERADMIN/TRAINER sehen alle
    if (!rolle || ['ADMIN', 'SUPERADMIN', 'TRAINER'].includes(rolle)) {
      return this.prisma.umfrage.findMany({
        where: { tenantId },
        include: {
          team: { select: { id: true, name: true } },
          abteilung: { select: { id: true, name: true } },
          antworten: true,
        },
        orderBy: { erstelltAm: 'desc' },
      });
    }

    // PARENT: Nur Umfragen fuer Teams/Abteilungen der Kinder + vereinsweite
    if (rolle === 'PARENT' && userId) {
      const kinderTeamIds = await this.kinderTeamIds(tenantId, userId);
      const kinderAbteilungIds = await this.kinderAbteilungIds(tenantId, userId);

      return this.prisma.umfrage.findMany({
        where: {
          tenantId,
          OR: [
            // Vereinsweite Umfragen (kein Team, keine Abteilung)
            { teamId: null, abteilungId: null },
            // Umfragen fuer Teams der Kinder
            ...(kinderTeamIds.length > 0 ? [{ teamId: { in: kinderTeamIds } }] : []),
            // Umfragen fuer Abteilungen der Kinder
            ...(kinderAbteilungIds.length > 0 ? [{ abteilungId: { in: kinderAbteilungIds } }] : []),
          ],
        },
        include: {
          team: { select: { id: true, name: true } },
          abteilung: { select: { id: true, name: true } },
          antworten: true,
        },
        orderBy: { erstelltAm: 'desc' },
      });
    }

    // MEMBER: Nur Umfragen fuer eigene Teams + vereinsweite
    if (rolle === 'MEMBER' && userId) {
      const memberTeamIds = await this.memberTeamIds(tenantId, userId);

      return this.prisma.umfrage.findMany({
        where: {
          tenantId,
          OR: [
            { teamId: null, abteilungId: null },
            ...(memberTeamIds.length > 0 ? [{ teamId: { in: memberTeamIds } }] : []),
          ],
        },
        include: {
          team: { select: { id: true, name: true } },
          abteilung: { select: { id: true, name: true } },
          antworten: true,
        },
        orderBy: { erstelltAm: 'desc' },
      });
    }

    // Fallback: vereinsweite Umfragen
    return this.prisma.umfrage.findMany({
      where: { tenantId, teamId: null, abteilungId: null },
      include: {
        team: { select: { id: true, name: true } },
        abteilung: { select: { id: true, name: true } },
        antworten: true,
      },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  /** Einzelne Umfrage mit Statistiken abrufen */
  async detailAbrufen(id: string, tenantId: string) {
    const umfrage = await this.prisma.umfrage.findFirst({
      where: { id, tenantId },
      include: {
        team: { select: { id: true, name: true } },
        abteilung: { select: { id: true, name: true } },
        antworten: true,
      },
    });

    if (!umfrage) {
      throw new NotFoundException('Umfrage nicht gefunden.');
    }

    // Statistiken pro Option berechnen
    const statistiken = umfrage.optionen.map((option) => {
      const stimmen = umfrage.antworten.filter((a) => a.option === option);
      return {
        option,
        anzahl: stimmen.length,
        prozent:
          umfrage.antworten.length > 0
            ? Math.round((stimmen.length / umfrage.antworten.length) * 100)
            : 0,
        namen: stimmen
          .map((a) => a.mitgliedName)
          .filter((n): n is string => n !== null),
      };
    });

    // Token generieren fuer Teilen
    const token = jwt.sign(
      { umfrageId: umfrage.id, tenantId } as UmfrageTokenPayload,
      this.jwtSecret,
      { expiresIn: '7d' },
    );

    return {
      ...umfrage,
      statistiken,
      token,
    };
  }

  /** Abstimmen (angemeldeter Benutzer) */
  async abstimmen(id: string, userId: string, option: string, mitgliedName?: string) {
    const umfrage = await this.prisma.umfrage.findFirst({
      where: { id },
    });

    if (!umfrage) {
      throw new NotFoundException('Umfrage nicht gefunden.');
    }

    if (umfrage.endetAm && new Date() > umfrage.endetAm) {
      throw new BadRequestException('Diese Umfrage ist bereits abgelaufen.');
    }

    if (!umfrage.optionen.includes(option)) {
      throw new BadRequestException('Ungueltige Option.');
    }

    // Pruefen ob Benutzer bereits abgestimmt hat
    const bereitsAbgestimmt = await this.prisma.umfrageAntwort.findFirst({
      where: { umfrageId: id, mitgliedId: userId },
    });

    if (bereitsAbgestimmt) {
      // Stimme aktualisieren statt Fehler
      return this.prisma.umfrageAntwort.update({
        where: { id: bereitsAbgestimmt.id },
        data: { option, mitgliedName: mitgliedName || bereitsAbgestimmt.mitgliedName },
      });
    }

    return this.prisma.umfrageAntwort.create({
      data: {
        umfrageId: id,
        mitgliedId: userId,
        mitgliedName: mitgliedName || null,
        option,
      },
    });
  }

  /** Umfrage loeschen (nur Ersteller oder Admin) */
  async loeschen(id: string, tenantId: string, userId: string, userRole: string) {
    const umfrage = await this.prisma.umfrage.findFirst({
      where: { id, tenantId },
    });

    if (!umfrage) {
      throw new NotFoundException('Umfrage nicht gefunden.');
    }

    // Nur Ersteller oder Admin/Superadmin duerfen loeschen
    if (
      umfrage.erstelltVon !== userId &&
      !['ADMIN', 'SUPERADMIN'].includes(userRole)
    ) {
      throw new ForbiddenException('Nur der Ersteller oder ein Admin kann diese Umfrage loeschen.');
    }

    await this.prisma.umfrageAntwort.deleteMany({ where: { umfrageId: id } });
    return this.prisma.umfrage.delete({ where: { id } });
  }

  /** Umfrage via Token abrufen (oeffentlicher Zugriff) */
  async tokenAbrufen(token: string) {
    const payload = this.tokenVerifizieren(token);

    const umfrage = await this.prisma.umfrage.findFirst({
      where: { id: payload.umfrageId },
      include: {
        team: { select: { id: true, name: true } },
        abteilung: { select: { id: true, name: true } },
        antworten: true,
      },
    });

    if (!umfrage) {
      throw new NotFoundException('Umfrage nicht gefunden.');
    }

    // Statistiken berechnen
    const statistiken = umfrage.optionen.map((option) => {
      const stimmen = umfrage.antworten.filter((a) => a.option === option);
      return {
        option,
        anzahl: stimmen.length,
        prozent:
          umfrage.antworten.length > 0
            ? Math.round((stimmen.length / umfrage.antworten.length) * 100)
            : 0,
      };
    });

    const abgelaufen = umfrage.endetAm ? new Date() > umfrage.endetAm : false;

    return {
      id: umfrage.id,
      frage: umfrage.frage,
      optionen: umfrage.optionen,
      endetAm: umfrage.endetAm,
      erstelltAm: umfrage.erstelltAm,
      teamName: umfrage.team?.name || null,
      abteilungName: umfrage.abteilung?.name || null,
      gesamtStimmen: umfrage.antworten.length,
      statistiken,
      abgelaufen,
    };
  }

  /** Abstimmen via Token (oeffentlicher Zugriff, kein Auth) */
  async tokenAbstimmen(token: string, option: string, name: string) {
    const payload = this.tokenVerifizieren(token);

    const umfrage = await this.prisma.umfrage.findFirst({
      where: { id: payload.umfrageId },
    });

    if (!umfrage) {
      throw new NotFoundException('Umfrage nicht gefunden.');
    }

    if (umfrage.endetAm && new Date() > umfrage.endetAm) {
      throw new BadRequestException('Diese Umfrage ist bereits abgelaufen.');
    }

    if (!umfrage.optionen.includes(option)) {
      throw new BadRequestException('Ungueltige Option.');
    }

    return this.prisma.umfrageAntwort.create({
      data: {
        umfrageId: umfrage.id,
        mitgliedId: null,
        mitgliedName: name,
        option,
      },
    });
  }

  // ==================== Hilfsmethoden ====================

  /** Team-IDs der Kinder eines Elternteils (via Familie + parentEmail Fallback) */
  private async kinderTeamIds(tenantId: string, userId: string): Promise<string[]> {
    // Via Familie
    const familienMitgliedschaften = await this.prisma.familieMitglied.findMany({
      where: {
        userId,
        rolle: { in: ['MUTTER', 'VATER', 'ERZIEHUNGSBERECHTIGTER', 'PARTNER'] },
      },
      select: { familieId: true },
    });

    let kinderIds: string[] = [];

    if (familienMitgliedschaften.length > 0) {
      const familieIds = familienMitgliedschaften.map((fm) => fm.familieId);
      const kinder = await this.prisma.familieMitglied.findMany({
        where: {
          familieId: { in: familieIds },
          rolle: 'KIND',
          memberId: { not: null },
        },
        select: { memberId: true },
      });
      kinderIds = kinder.map((k) => k.memberId!).filter(Boolean);
    }

    // Fallback: parentEmail
    if (kinderIds.length === 0) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user) {
        const kinderViaEmail = await this.prisma.member.findMany({
          where: { tenantId, parentEmail: user.email },
          select: { id: true },
        });
        kinderIds = kinderViaEmail.map((k) => k.id);
      }
    }

    if (kinderIds.length === 0) return [];

    const teamMitgliedschaften = await this.prisma.teamMember.findMany({
      where: { memberId: { in: kinderIds } },
      select: { teamId: true },
    });

    return [...new Set(teamMitgliedschaften.map((tm) => tm.teamId))];
  }

  /** Abteilungs-IDs der Kinder eines Elternteils */
  private async kinderAbteilungIds(tenantId: string, userId: string): Promise<string[]> {
    const teamIds = await this.kinderTeamIds(tenantId, userId);
    if (teamIds.length === 0) return [];

    const teams = await this.prisma.team.findMany({
      where: { id: { in: teamIds }, tenantId },
      select: { abteilungId: true },
    });

    return [...new Set(
      teams.map((t) => t.abteilungId).filter((id): id is string => !!id),
    )];
  }

  /** Team-IDs eines Members (fuer MEMBER-Rolle) */
  private async memberTeamIds(tenantId: string, userId: string): Promise<string[]> {
    const member = await this.prisma.member.findFirst({
      where: { userId, tenantId },
      select: { id: true },
    });

    if (!member) return [];

    const teamMitgliedschaften = await this.prisma.teamMember.findMany({
      where: { memberId: member.id },
      select: { teamId: true },
    });

    return teamMitgliedschaften.map((tm) => tm.teamId);
  }

  /** Token verifizieren */
  private tokenVerifizieren(token: string): UmfrageTokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as UmfrageTokenPayload;
    } catch {
      throw new BadRequestException('Ungueltiger oder abgelaufener Link.');
    }
  }
}
