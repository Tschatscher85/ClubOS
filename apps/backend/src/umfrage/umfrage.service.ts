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
        endetAm: dto.endetAm ? new Date(dto.endetAm) : null,
      },
      include: {
        team: { select: { id: true, name: true } },
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

  /** Alle Umfragen eines Vereins abrufen */
  async alleAbrufen(tenantId: string) {
    return this.prisma.umfrage.findMany({
      where: { tenantId },
      include: {
        team: { select: { id: true, name: true } },
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

  /** Token verifizieren */
  private tokenVerifizieren(token: string): UmfrageTokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as UmfrageTokenPayload;
    } catch {
      throw new BadRequestException('Ungueltiger oder abgelaufener Link.');
    }
  }
}
