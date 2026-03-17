import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleEventDto, AktualisiereEventDto } from './dto/erstelle-event.dto';
import { AnmeldungDto } from './dto/anmeldung.dto';
import { KommentarDto } from './dto/kommentar.dto';
import { AttendanceStatus } from '@prisma/client';
import { ReminderService } from './reminder.service';
import * as crypto from 'crypto';

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private reminderService: ReminderService,
  ) {}

  async erstellen(tenantId: string, dto: ErstelleEventDto) {
    // Wiederholungsregel generieren
    const recurrenceRule = dto.wiederholung
      ? `${dto.wiederholung}:${(dto.wiederholungTage ?? []).join(',')}`
      : null;
    const recurrenceEnd = dto.wiederholungEnde
      ? new Date(dto.wiederholungEnde)
      : null;

    const event = await this.prisma.event.create({
      data: {
        title: dto.titel,
        type: dto.typ,
        date: new Date(dto.datum),
        endDate: dto.endDatum ? new Date(dto.endDatum) : null,
        location: dto.ort,
        hallName: dto.hallenName,
        hallAddress: dto.hallenAdresse,
        teamId: dto.teamId,
        tenantId,
        notes: dto.notizen,
        recurrenceRule,
        recurrenceEnd,
      },
      include: { team: true },
    });

    // Automatisch PENDING-Eintraege fuer alle Team-Mitglieder anlegen
    const teamMitglieder = await this.prisma.teamMember.findMany({
      where: { teamId: dto.teamId },
      select: { memberId: true },
    });

    if (teamMitglieder.length > 0) {
      await this.prisma.attendance.createMany({
        data: teamMitglieder.map((tm) => ({
          eventId: event.id,
          memberId: tm.memberId,
          status: AttendanceStatus.PENDING,
        })),
        skipDuplicates: true,
      });
    }

    // Erinnerungen fuer das Hauptevent erstellen
    await this.reminderService.erinnerungenErstellen(event.id, event.date);

    // Wiederkehrende Events generieren
    if (dto.wiederholung && recurrenceEnd) {
      await this.wiederkehrendeEventsErstellen(
        tenantId,
        event,
        dto,
        teamMitglieder.map((tm) => tm.memberId),
        recurrenceEnd,
      );
    }

    return event;
  }

  /**
   * Generiert wiederkehrende Events basierend auf Wiederholungsregel.
   * Maximal 52 Wochen in die Zukunft.
   */
  private async wiederkehrendeEventsErstellen(
    tenantId: string,
    elternEvent: { id: string; date: Date; endDate: Date | null },
    dto: ErstelleEventDto,
    mitgliederIds: string[],
    wiederholungEnde: Date,
  ) {
    const tageMap: Record<string, number> = {
      SO: 0,
      MO: 1,
      DI: 2,
      MI: 3,
      DO: 4,
      FR: 5,
      SA: 6,
    };

    const wochentage = (dto.wiederholungTage ?? [])
      .map((tag) => tageMap[tag.toUpperCase()])
      .filter((t) => t !== undefined);

    // Falls keine Tage angegeben, Wochentag des Startdatums verwenden
    if (wochentage.length === 0) {
      wochentage.push(elternEvent.date.getDay());
    }

    const intervallWochen = dto.wiederholung === 'BIWEEKLY' ? 2 : 1;
    const maxDatum = new Date(elternEvent.date);
    maxDatum.setDate(maxDatum.getDate() + 52 * 7); // Max 52 Wochen

    const endGrenze = wiederholungEnde < maxDatum ? wiederholungEnde : maxDatum;

    // Dauer des Events berechnen (falls endDate vorhanden)
    const dauerMs = elternEvent.endDate
      ? elternEvent.endDate.getTime() - elternEvent.date.getTime()
      : 0;

    // Uhrzeit des Startdatums merken
    const startStunde = elternEvent.date.getHours();
    const startMinute = elternEvent.date.getMinutes();

    const termine: Date[] = [];
    const aktuellesDatum = new Date(elternEvent.date);

    // Naechste Woche(n) starten
    aktuellesDatum.setDate(aktuellesDatum.getDate() + intervallWochen * 7);

    while (aktuellesDatum <= endGrenze) {
      for (const wochentag of wochentage) {
        const terminDatum = new Date(aktuellesDatum);
        // Auf den richtigen Wochentag setzen
        const tagesBis = (wochentag - terminDatum.getDay() + 7) % 7;
        terminDatum.setDate(terminDatum.getDate() + tagesBis);
        terminDatum.setHours(startStunde, startMinute, 0, 0);

        if (terminDatum > elternEvent.date && terminDatum <= endGrenze) {
          termine.push(new Date(terminDatum));
        }
      }
      aktuellesDatum.setDate(aktuellesDatum.getDate() + intervallWochen * 7);
    }

    // Duplikate entfernen und sortieren
    const eindeutigeTermine = [...new Set(termine.map((t) => t.getTime()))]
      .sort()
      .map((t) => new Date(t));

    // Jedes Kind-Event einzeln erstellen und Anwesenheiten + Erinnerungen anlegen
    for (const termin of eindeutigeTermine) {
      const kindEvent = await this.prisma.event.create({
        data: {
          title: dto.titel,
          type: dto.typ,
          date: termin,
          endDate: dauerMs > 0 ? new Date(termin.getTime() + dauerMs) : null,
          location: dto.ort,
          hallName: dto.hallenName,
          hallAddress: dto.hallenAdresse,
          teamId: dto.teamId,
          tenantId,
          notes: dto.notizen,
          parentEventId: elternEvent.id,
          recurrenceRule: `${dto.wiederholung}:${(dto.wiederholungTage ?? []).join(',')}`,
          recurrenceEnd: endGrenze,
        },
      });

      // PENDING-Anwesenheiten fuer Teammitglieder
      if (mitgliederIds.length > 0) {
        await this.prisma.attendance.createMany({
          data: mitgliederIds.map((memberId) => ({
            eventId: kindEvent.id,
            memberId,
            status: AttendanceStatus.PENDING,
          })),
          skipDuplicates: true,
        });
      }

      // Erinnerungen fuer Kind-Event erstellen
      await this.reminderService.erinnerungenErstellen(kindEvent.id, termin);
    }
  }

  async alleAbrufen(tenantId: string) {
    return this.prisma.event.findMany({
      where: { tenantId },
      include: {
        team: { select: { id: true, name: true, sport: true } },
        _count: { select: { attendances: true } },
        attendances: {
          select: { status: true },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async kommendeAbrufen(tenantId: string) {
    return this.prisma.event.findMany({
      where: {
        tenantId,
        date: { gte: new Date() },
      },
      include: {
        team: { select: { id: true, name: true, sport: true } },
        _count: { select: { attendances: true } },
        attendances: {
          select: { status: true },
        },
      },
      orderBy: { date: 'asc' },
      take: 20,
    });
  }

  async nachIdAbrufen(tenantId: string, id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, tenantId },
      include: {
        team: true,
        attendances: {
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
        },
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    return event;
  }

  async aktualisieren(tenantId: string, id: string, dto: AktualisiereEventDto) {
    await this.nachIdAbrufen(tenantId, id);

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.titel !== undefined && { title: dto.titel }),
        ...(dto.typ !== undefined && { type: dto.typ }),
        ...(dto.datum !== undefined && { date: new Date(dto.datum) }),
        ...(dto.endDatum !== undefined && {
          endDate: dto.endDatum ? new Date(dto.endDatum) : null,
        }),
        ...(dto.ort !== undefined && { location: dto.ort }),
        ...(dto.hallenName !== undefined && { hallName: dto.hallenName }),
        ...(dto.hallenAdresse !== undefined && { hallAddress: dto.hallenAdresse }),
        ...(dto.notizen !== undefined && { notes: dto.notizen }),
      },
      include: { team: true },
    });
  }

  async loeschen(tenantId: string, id: string) {
    await this.nachIdAbrufen(tenantId, id);
    return this.prisma.event.delete({ where: { id } });
  }

  async naechstesEvent(tenantId: string) {
    return this.prisma.event.findFirst({
      where: {
        tenantId,
        date: { gte: new Date() },
      },
      include: {
        team: { select: { name: true } },
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  // ==================== Eltern-Portal ====================

  /** Events fuer Teams abrufen, in denen Kinder des Elternteils spielen */
  async eventsFuerEltern(tenantId: string, elternEmail: string) {
    // Kinder des Elternteils finden
    const kinder = await this.prisma.member.findMany({
      where: {
        tenantId,
        parentEmail: elternEmail,
      },
      select: { id: true },
    });

    if (kinder.length === 0) {
      return [];
    }

    const kinderIds = kinder.map((k) => k.id);

    // Teams der Kinder finden
    const teamMitgliedschaften = await this.prisma.teamMember.findMany({
      where: {
        memberId: { in: kinderIds },
        team: { tenantId },
      },
      select: { teamId: true },
    });

    const teamIds = [...new Set(teamMitgliedschaften.map((tm) => tm.teamId))];

    if (teamIds.length === 0) {
      return [];
    }

    // Kommende Events dieser Teams abrufen
    return this.prisma.event.findMany({
      where: {
        tenantId,
        teamId: { in: teamIds },
        date: { gte: new Date() },
      },
      include: {
        team: { select: { id: true, name: true, sport: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  // ==================== An-/Abmeldung ====================

  async anmeldungSetzen(tenantId: string, eventId: string, dto: AnmeldungDto) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    // Pflichtgrund bei Absage
    if (dto.status === AttendanceStatus.NO && (!dto.grund || dto.grund.trim().length < 3)) {
      throw new BadRequestException('Bei einer Absage muss ein Grund angegeben werden.');
    }

    return this.prisma.attendance.upsert({
      where: {
        eventId_memberId: { eventId, memberId: dto.memberId },
      },
      update: {
        status: dto.status,
        reason: dto.status === AttendanceStatus.NO ? dto.grund : null,
        answeredAt: new Date(),
      },
      create: {
        eventId,
        memberId: dto.memberId,
        status: dto.status,
        reason: dto.status === AttendanceStatus.NO ? dto.grund : null,
        answeredAt: new Date(),
      },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async anmeldungenAbrufen(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    const anmeldungen = await this.prisma.attendance.findMany({
      where: { eventId },
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
      orderBy: { createdAt: 'asc' },
    });

    const zusammenfassung = {
      gesamt: anmeldungen.length,
      zugesagt: anmeldungen.filter((a) => a.status === 'YES').length,
      abgesagt: anmeldungen.filter((a) => a.status === 'NO').length,
      vielleicht: anmeldungen.filter((a) => a.status === 'MAYBE').length,
      offen: anmeldungen.filter((a) => a.status === 'PENDING').length,
    };

    return { anmeldungen, zusammenfassung };
  }

  // ==================== Schnell-Anmeldung per Token ====================

  /**
   * Generiert fuer jedes Teammitglied eines Events einen Schnell-Anmeldung-Token.
   * Gueltig fuer 7 Tage.
   */
  async schnellTokensGenerieren(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      include: {
        attendances: {
          select: { memberId: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    const mitgliederIds = event.attendances.map((a) => a.memberId);

    if (mitgliederIds.length === 0) {
      throw new BadRequestException('Keine Teammitglieder fuer diese Veranstaltung gefunden.');
    }

    const gueltigBis = new Date();
    gueltigBis.setDate(gueltigBis.getDate() + 7);

    // Bestehende unbenutzte Tokens loeschen
    await this.prisma.schnellAnmeldungToken.deleteMany({
      where: { eventId, benutzt: false },
    });

    const tokens = [];
    for (const memberId of mitgliederIds) {
      const token = await this.prisma.schnellAnmeldungToken.create({
        data: {
          token: crypto.randomUUID(),
          eventId,
          memberId,
          gueltigBis,
        },
      });
      tokens.push(token);
    }

    return {
      nachricht: `${tokens.length} Schnell-Anmeldung-Token generiert.`,
      tokens,
    };
  }

  /**
   * Oeffentliche Schnell-Anmeldung per Token (kein Auth noetig).
   * Validiert Token, prueft Ablaufdatum, setzt Anwesenheitsstatus.
   */
  async schnellAnmeldung(token: string, status: AttendanceStatus, grund?: string) {
    const tokenEintrag = await this.prisma.schnellAnmeldungToken.findUnique({
      where: { token },
      include: {
        event: { select: { id: true, title: true, date: true, tenantId: true } },
      },
    });

    if (!tokenEintrag) {
      throw new NotFoundException('Ungueltiger oder abgelaufener Token.');
    }

    if (tokenEintrag.benutzt) {
      throw new BadRequestException('Dieser Token wurde bereits verwendet.');
    }

    if (new Date() > tokenEintrag.gueltigBis) {
      throw new BadRequestException('Dieser Token ist abgelaufen.');
    }

    // Pflichtgrund bei Absage
    if (status === AttendanceStatus.NO && (!grund || grund.trim().length < 3)) {
      throw new BadRequestException('Bei einer Absage muss ein Grund angegeben werden.');
    }

    // Anwesenheit setzen
    const anmeldung = await this.prisma.attendance.upsert({
      where: {
        eventId_memberId: {
          eventId: tokenEintrag.eventId,
          memberId: tokenEintrag.memberId,
        },
      },
      update: {
        status,
        reason: status === AttendanceStatus.NO ? grund : null,
        answeredAt: new Date(),
      },
      create: {
        eventId: tokenEintrag.eventId,
        memberId: tokenEintrag.memberId,
        status,
        reason: status === AttendanceStatus.NO ? grund : null,
        answeredAt: new Date(),
      },
    });

    // Token als benutzt markieren
    await this.prisma.schnellAnmeldungToken.update({
      where: { id: tokenEintrag.id },
      data: { benutzt: true },
    });

    return {
      nachricht: 'Anmeldung erfolgreich gespeichert.',
      veranstaltung: tokenEintrag.event.title,
      datum: tokenEintrag.event.date,
      status: anmeldung.status,
    };
  }

  // ==================== Anwesenheitsstatistik ====================

  /**
   * Gibt Anwesenheitsstatistik fuer ein Mitglied zurueck.
   * Beruecksichtigt nur Events des angegebenen Tenants.
   */
  async anwesenheitsStatistik(tenantId: string, memberId: string) {
    // Pruefen ob Mitglied zum Tenant gehoert
    const mitglied = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!mitglied) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    // Alle Anwesenheiten des Mitglieds (nur Events dieses Tenants)
    const alleAnwesenheiten = await this.prisma.attendance.findMany({
      where: {
        memberId,
        event: { tenantId },
      },
      include: {
        event: {
          select: { id: true, title: true, date: true, type: true },
        },
      },
      orderBy: { event: { date: 'desc' } },
    });

    const gesamt = alleAnwesenheiten.length;
    const zugesagt = alleAnwesenheiten.filter((a) => a.status === 'YES').length;
    const abgesagt = alleAnwesenheiten.filter((a) => a.status === 'NO').length;
    const vielleicht = alleAnwesenheiten.filter((a) => a.status === 'MAYBE').length;
    const offen = alleAnwesenheiten.filter((a) => a.status === 'PENDING').length;
    const anwesenheitsQuote = gesamt > 0 ? Math.round((zugesagt / gesamt) * 100) : 0;

    // Letzte 10 Events mit Status
    const letzteZehn = alleAnwesenheiten.slice(0, 10).map((a) => ({
      eventId: a.event.id,
      titel: a.event.title,
      datum: a.event.date,
      typ: a.event.type,
      status: a.status,
      grund: a.reason,
    }));

    return {
      mitglied: {
        id: mitglied.id,
        name: `${mitglied.firstName} ${mitglied.lastName}`,
      },
      statistik: {
        gesamt,
        zugesagt,
        abgesagt,
        vielleicht,
        offen,
        anwesenheitsQuote,
      },
      letzteEvents: letzteZehn,
    };
  }

  // ==================== CSV-Export ====================

  /**
   * Exportiert die Anwesenheitsliste eines Events als CSV-String.
   */
  async anwesenheitAlsCsv(tenantId: string, eventId: string): Promise<string> {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    const anmeldungen = await this.prisma.attendance.findMany({
      where: { eventId },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            memberNumber: true,
          },
        },
      },
      orderBy: { member: { lastName: 'asc' } },
    });

    const statusUebersetzung: Record<string, string> = {
      YES: 'Zugesagt',
      NO: 'Abgesagt',
      MAYBE: 'Vielleicht',
      PENDING: 'Offen',
    };

    // CSV-Header
    const zeilen: string[] = ['Name,Mitgliedsnummer,Status,Grund'];

    // CSV-Zeilen
    for (const a of anmeldungen) {
      const name = `${a.member.lastName}, ${a.member.firstName}`;
      const nummer = a.member.memberNumber;
      const status = statusUebersetzung[a.status] ?? a.status;
      const grund = a.reason ? `"${a.reason.replace(/"/g, '""')}"` : '';
      zeilen.push(`${name},${nummer},${status},${grund}`);
    }

    return zeilen.join('\n');
  }

  // ==================== Kommentare ====================

  async kommentarErstellen(
    tenantId: string,
    eventId: string,
    userId: string,
    dto: KommentarDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    return this.prisma.eventComment.create({
      data: {
        eventId,
        userId,
        content: dto.inhalt,
      },
    });
  }

  async kommentareAbrufen(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    return this.prisma.eventComment.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
