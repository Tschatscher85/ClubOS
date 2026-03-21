import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BuchungsTyp } from '@prisma/client';
import {
  StrafeErstellenDto,
  EinzahlungErstellenDto,
  AusgabeErstellenDto,
  StrafkatalogErstellenDto,
} from './dto/kasse.dto';

@Injectable()
export class KasseService {
  constructor(private prisma: PrismaService) {}

  /** Team pruefen und Kasse holen/erstellen */
  private async kasseHolenOderErstellen(tenantId: string, teamId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });

    if (!team) {
      throw new NotFoundException('Mannschaft nicht gefunden.');
    }

    return this.prisma.teamKasse.upsert({
      where: { teamId },
      create: { teamId, stand: 0 },
      update: {},
    });
  }

  /** Kassenstand + letzte 20 Buchungen */
  async kassenstandAbrufen(tenantId: string, teamId: string) {
    const kasse = await this.kasseHolenOderErstellen(tenantId, teamId);

    const buchungen = await this.prisma.kasseBuchung.findMany({
      where: { kasseId: kasse.id },
      orderBy: { erstelltAm: 'desc' },
      take: 20,
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
    });

    const gesamt = await this.prisma.kasseBuchung.count({
      where: { kasseId: kasse.id },
    });

    return {
      id: kasse.id,
      teamId: kasse.teamId,
      stand: kasse.stand,
      buchungen,
      gesamtBuchungen: gesamt,
    };
  }

  /** Kompletter Verlauf mit Pagination (transparent fuer Trainer) */
  async verlaufAbrufen(
    tenantId: string,
    teamId: string,
    seite: number = 1,
    proSeite: number = 50,
    typ?: string,
  ) {
    const kasse = await this.kasseHolenOderErstellen(tenantId, teamId);

    const where: Record<string, unknown> = { kasseId: kasse.id };
    if (typ && ['STRAFE', 'EINZAHLUNG', 'AUSGABE'].includes(typ)) {
      where.typ = typ;
    }

    const [buchungen, gesamt] = await Promise.all([
      this.prisma.kasseBuchung.findMany({
        where,
        orderBy: { erstelltAm: 'desc' },
        skip: (seite - 1) * proSeite,
        take: proSeite,
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              memberNumber: true,
            },
          },
        },
      }),
      this.prisma.kasseBuchung.count({ where }),
    ]);

    return {
      buchungen,
      gesamt,
      seite,
      proSeite,
      seiten: Math.ceil(gesamt / proSeite),
    };
  }

  /** Strafe verhaengen */
  async strafeVerhaengen(
    tenantId: string,
    teamId: string,
    userId: string,
    dto: StrafeErstellenDto,
  ) {
    const kasse = await this.kasseHolenOderErstellen(tenantId, teamId);

    // Wenn katalogId angegeben, Betrag und Grund aus Katalog holen
    let betrag = dto.betrag;
    let grund = dto.grund;

    if (dto.katalogId) {
      const katalogEintrag = await this.prisma.strafkatalog.findFirst({
        where: { id: dto.katalogId, teamId },
      });
      if (katalogEintrag) {
        betrag = katalogEintrag.betrag;
        grund = katalogEintrag.name;
      }
    }

    const buchung = await this.prisma.kasseBuchung.create({
      data: {
        kasseId: kasse.id,
        memberId: dto.memberId,
        betrag,
        grund,
        typ: BuchungsTyp.STRAFE,
        erstelltVon: userId,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
    });

    // Kassenstand ist hier nicht direkt betroffen (Strafe = offene Forderung)
    // Aber wir tracken es als negativen Betrag fuer den Spieler
    // Kassenstand aendert sich erst bei Einzahlung

    return buchung;
  }

  /** Einzahlung buchen */
  async einzahlungBuchen(
    tenantId: string,
    teamId: string,
    userId: string,
    dto: EinzahlungErstellenDto,
  ) {
    const kasse = await this.kasseHolenOderErstellen(tenantId, teamId);

    const [buchung] = await this.prisma.$transaction([
      this.prisma.kasseBuchung.create({
        data: {
          kasseId: kasse.id,
          memberId: dto.memberId,
          betrag: dto.betrag,
          grund: dto.grund,
          typ: BuchungsTyp.EINZAHLUNG,
          erstelltVon: userId,
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              memberNumber: true,
            },
          },
        },
      }),
      this.prisma.teamKasse.update({
        where: { id: kasse.id },
        data: { stand: { increment: dto.betrag } },
      }),
    ]);

    return buchung;
  }

  /** Ausgabe buchen */
  async ausgabeBuchen(
    tenantId: string,
    teamId: string,
    userId: string,
    dto: AusgabeErstellenDto,
  ) {
    const kasse = await this.kasseHolenOderErstellen(tenantId, teamId);

    const [buchung] = await this.prisma.$transaction([
      this.prisma.kasseBuchung.create({
        data: {
          kasseId: kasse.id,
          memberId: dto.memberId,
          betrag: dto.betrag,
          grund: dto.grund,
          typ: BuchungsTyp.AUSGABE,
          erstelltVon: userId,
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              memberNumber: true,
            },
          },
        },
      }),
      this.prisma.teamKasse.update({
        where: { id: kasse.id },
        data: { stand: { decrement: dto.betrag } },
      }),
    ]);

    return buchung;
  }

  /** Saldo pro Mitglied berechnen */
  async saldoProMitglied(tenantId: string, teamId: string) {
    const kasse = await this.kasseHolenOderErstellen(tenantId, teamId);

    const buchungen = await this.prisma.kasseBuchung.findMany({
      where: { kasseId: kasse.id },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
    });

    // Saldo berechnen: Strafen erhoehen Schulden, Einzahlungen verringern sie
    const saldoMap = new Map<
      string,
      {
        memberId: string;
        firstName: string;
        lastName: string;
        memberNumber: string;
        strafen: number;
        einzahlungen: number;
        saldo: number;
      }
    >();

    for (const buchung of buchungen) {
      const key = buchung.memberId;
      if (!saldoMap.has(key)) {
        saldoMap.set(key, {
          memberId: buchung.member.id,
          firstName: buchung.member.firstName,
          lastName: buchung.member.lastName,
          memberNumber: buchung.member.memberNumber,
          strafen: 0,
          einzahlungen: 0,
          saldo: 0,
        });
      }

      const eintrag = saldoMap.get(key)!;

      if (buchung.typ === BuchungsTyp.STRAFE) {
        eintrag.strafen += buchung.betrag;
        eintrag.saldo -= buchung.betrag;
      } else if (buchung.typ === BuchungsTyp.EINZAHLUNG) {
        eintrag.einzahlungen += buchung.betrag;
        eintrag.saldo += buchung.betrag;
      }
      // Ausgaben betreffen nicht das individuelle Mitglied-Saldo
    }

    return Array.from(saldoMap.values()).sort((a, b) => a.saldo - b.saldo);
  }

  /** Strafkatalog abrufen */
  async katalogAbrufen(tenantId: string, teamId: string) {
    // Team-Zugehoerigkeit pruefen
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });

    if (!team) {
      throw new NotFoundException('Mannschaft nicht gefunden.');
    }

    return this.prisma.strafkatalog.findMany({
      where: { teamId },
      orderBy: { name: 'asc' },
    });
  }

  /** Strafkatalog-Eintrag erstellen */
  async katalogEintragErstellen(
    tenantId: string,
    teamId: string,
    dto: StrafkatalogErstellenDto,
  ) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });

    if (!team) {
      throw new NotFoundException('Mannschaft nicht gefunden.');
    }

    return this.prisma.strafkatalog.create({
      data: {
        teamId,
        name: dto.name,
        betrag: dto.betrag,
      },
    });
  }

  /** Strafkatalog-Eintrag loeschen */
  async katalogEintragLoeschen(
    tenantId: string,
    teamId: string,
    id: string,
  ) {
    const eintrag = await this.prisma.strafkatalog.findFirst({
      where: { id, teamId },
    });

    if (!eintrag) {
      throw new NotFoundException('Strafkatalog-Eintrag nicht gefunden.');
    }

    // Team-Zugehoerigkeit pruefen
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });

    if (!team) {
      throw new NotFoundException('Mannschaft nicht gefunden.');
    }

    return this.prisma.strafkatalog.delete({ where: { id } });
  }
}
