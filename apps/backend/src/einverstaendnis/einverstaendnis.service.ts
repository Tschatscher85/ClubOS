import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EinverstaendnisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'vereinbase-secret';
  }

  /**
   * Einverstaendniserklaerung fuer ein Event erstellen
   */
  async erstellen(
    tenantId: string,
    eventId: string,
    titel: string,
    inhalt: string,
    userId: string,
  ) {
    // Pruefen ob Event existiert und zum Tenant gehoert
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    const einverstaendnis = await this.prisma.einverstaendnis.create({
      data: {
        tenantId,
        eventId,
        titel,
        inhalt,
        erstelltVon: userId,
      },
      include: {
        antworten: {
          include: { member: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    return einverstaendnis;
  }

  /**
   * Einverstaendniserklaerung(en) fuer ein Event laden
   */
  async fuerEventLaden(tenantId: string, eventId: string) {
    const einverstaendnisse = await this.prisma.einverstaendnis.findMany({
      where: { tenantId, eventId },
      include: {
        antworten: {
          include: {
            member: {
              select: { id: true, firstName: true, lastName: true, parentEmail: true },
            },
          },
        },
      },
      orderBy: { erstelltAm: 'desc' },
    });

    // Auch alle Team-Mitglieder laden um den Status anzuzeigen
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      select: {
        teamId: true,
        team: {
          select: {
            teamMembers: {
              select: {
                member: {
                  select: { id: true, firstName: true, lastName: true, parentEmail: true },
                },
              },
            },
          },
        },
      },
    });

    const teamMitglieder = event?.team?.teamMembers?.map((tm) => tm.member) || [];

    return { einverstaendnisse, teamMitglieder };
  }

  /**
   * Antwort auf eine Einverstaendniserklaerung speichern
   */
  async antworten(
    einverstaendnisId: string,
    mitgliedId: string,
    elternName: string,
    zugestimmt: boolean,
    unterschrift?: string,
    ipAdresse?: string,
  ) {
    // Pruefen ob Einverstaendnis existiert
    const einverstaendnis = await this.prisma.einverstaendnis.findUnique({
      where: { id: einverstaendnisId },
    });
    if (!einverstaendnis) {
      throw new NotFoundException('Einverstaendniserklaerung nicht gefunden.');
    }

    const antwort = await this.prisma.einverstaendnisAntwort.upsert({
      where: {
        einverstaendnisId_mitgliedId: {
          einverstaendnisId,
          mitgliedId,
        },
      },
      create: {
        einverstaendnisId,
        mitgliedId,
        elternName,
        zugestimmt,
        unterschrift,
        ipAdresse,
      },
      update: {
        elternName,
        zugestimmt,
        unterschrift,
        ipAdresse,
        beantwortetAm: new Date(),
      },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return antwort;
  }

  /**
   * Token generieren fuer eine Einverstaendniserklaerung + Mitglied
   */
  tokenGenerieren(einverstaendnisId: string, mitgliedId: string): string {
    return jwt.sign(
      { einverstaendnisId, mitgliedId, typ: 'einverstaendnis' },
      this.jwtSecret,
      { expiresIn: '30d' },
    );
  }

  /**
   * Token-basiert: Einverstaendnis laden
   */
  async tokenLaden(token: string) {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as {
        einverstaendnisId: string;
        mitgliedId: string;
        typ: string;
      };

      if (payload.typ !== 'einverstaendnis') {
        throw new ForbiddenException('Ungueltiger Token.');
      }

      const einverstaendnis = await this.prisma.einverstaendnis.findUnique({
        where: { id: payload.einverstaendnisId },
        include: {
          event: { select: { title: true, date: true, location: true } },
        },
      });

      if (!einverstaendnis) {
        throw new NotFoundException('Einverstaendniserklaerung nicht gefunden.');
      }

      const mitglied = await this.prisma.member.findUnique({
        where: { id: payload.mitgliedId },
        select: { id: true, firstName: true, lastName: true, parentEmail: true },
      });

      // Pruefen ob schon beantwortet
      const bestehendeAntwort = await this.prisma.einverstaendnisAntwort.findUnique({
        where: {
          einverstaendnisId_mitgliedId: {
            einverstaendnisId: payload.einverstaendnisId,
            mitgliedId: payload.mitgliedId,
          },
        },
      });

      return {
        einverstaendnis,
        mitglied,
        bereitsBeantwortet: !!bestehendeAntwort,
        bestehendeAntwort,
      };
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new ForbiddenException('Ungueltiger oder abgelaufener Token.');
    }
  }

  /**
   * Token-basiert: Antwort senden
   */
  async tokenAntworten(
    token: string,
    elternName: string,
    zugestimmt: boolean,
    unterschrift?: string,
    ipAdresse?: string,
  ) {
    const payload = jwt.verify(token, this.jwtSecret) as {
      einverstaendnisId: string;
      mitgliedId: string;
      typ: string;
    };

    if (payload.typ !== 'einverstaendnis') {
      throw new ForbiddenException('Ungueltiger Token.');
    }

    return this.antworten(
      payload.einverstaendnisId,
      payload.mitgliedId,
      elternName,
      zugestimmt,
      unterschrift,
      ipAdresse,
    );
  }

  /**
   * Tokens fuer alle Team-Mitglieder eines Events generieren
   */
  async tokensFuerEventGenerieren(tenantId: string, einverstaendnisId: string) {
    const einverstaendnis = await this.prisma.einverstaendnis.findFirst({
      where: { id: einverstaendnisId, tenantId },
      include: {
        event: {
          select: {
            teamId: true,
            team: {
              select: {
                teamMembers: {
                  select: {
                    member: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        parentEmail: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!einverstaendnis) {
      throw new NotFoundException('Einverstaendniserklaerung nicht gefunden.');
    }

    const tokens = einverstaendnis.event.team.teamMembers.map((tm) => ({
      mitgliedId: tm.member.id,
      vorname: tm.member.firstName,
      nachname: tm.member.lastName,
      parentEmail: tm.member.parentEmail,
      token: this.tokenGenerieren(einverstaendnisId, tm.member.id),
    }));

    return tokens;
  }
}
