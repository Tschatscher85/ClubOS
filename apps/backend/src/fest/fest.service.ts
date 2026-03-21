import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FestKassenTyp } from '@prisma/client';

// ==================== DTOs ====================

export interface ErstelleSchichtDto {
  name: string;
  startZeit?: string;
  endZeit?: string;
  maxHelfer?: number;
}

export interface ErstelleEinkaufDto {
  artikel: string;
  menge?: string;
  kauftEin?: string;
}

export interface AktualisiereEinkaufDto {
  artikel?: string;
  menge?: string;
  kauftEin?: string;
  erledigt?: boolean;
}

export interface ErstelleKasseDto {
  typ: FestKassenTyp;
  betrag: number;
  beschreibung: string;
}

// ==================== Service ====================

@Injectable()
export class FestService {
  constructor(private prisma: PrismaService) {}

  // ==================== Schichten ====================

  async schichtErstellen(
    tenantId: string,
    eventId: string,
    dto: ErstelleSchichtDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    return this.prisma.festSchicht.create({
      data: {
        eventId,
        tenantId,
        name: dto.name,
        startZeit: dto.startZeit ?? null,
        endZeit: dto.endZeit ?? null,
        maxHelfer: dto.maxHelfer ?? 3,
      },
      include: {
        helfer: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async schichtenAuflisten(tenantId: string, eventId: string) {
    return this.prisma.festSchicht.findMany({
      where: { eventId, tenantId },
      include: {
        helfer: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { erstelltAm: 'asc' },
        },
      },
      orderBy: { startZeit: 'asc' },
    });
  }

  async schichtLoeschen(tenantId: string, id: string) {
    const schicht = await this.prisma.festSchicht.findFirst({
      where: { id, tenantId },
    });
    if (!schicht) {
      throw new NotFoundException('Schicht nicht gefunden.');
    }
    await this.prisma.festSchicht.delete({ where: { id } });
    return { nachricht: 'Schicht erfolgreich geloescht.' };
  }

  async schichtEintragen(tenantId: string, schichtId: string, userId: string) {
    const schicht = await this.prisma.festSchicht.findFirst({
      where: { id: schichtId, tenantId },
      include: { helfer: true },
    });
    if (!schicht) {
      throw new NotFoundException('Schicht nicht gefunden.');
    }

    // Mitglied-ID aus User ermitteln
    const member = await this.prisma.member.findFirst({
      where: { userId, tenantId },
    });
    if (!member) {
      throw new BadRequestException(
        'Kein Mitgliedsprofil gefunden. Bitte zuerst ein Profil anlegen.',
      );
    }

    // Pruefen ob bereits eingetragen
    const bereitsEingetragen = schicht.helfer.some(
      (h) => h.mitgliedId === member.id,
    );
    if (bereitsEingetragen) {
      throw new BadRequestException('Sie sind bereits fuer diese Schicht eingetragen.');
    }

    // Pruefen ob Schicht voll
    if (schicht.helfer.length >= schicht.maxHelfer) {
      throw new BadRequestException('Diese Schicht ist bereits voll besetzt.');
    }

    return this.prisma.festSchichtHelfer.create({
      data: {
        schichtId,
        mitgliedId: member.id,
      },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async schichtAustragen(tenantId: string, schichtId: string, userId: string) {
    const schicht = await this.prisma.festSchicht.findFirst({
      where: { id: schichtId, tenantId },
    });
    if (!schicht) {
      throw new NotFoundException('Schicht nicht gefunden.');
    }

    const member = await this.prisma.member.findFirst({
      where: { userId, tenantId },
    });
    if (!member) {
      throw new BadRequestException('Kein Mitgliedsprofil gefunden.');
    }

    const eintrag = await this.prisma.festSchichtHelfer.findUnique({
      where: {
        schichtId_mitgliedId: {
          schichtId,
          mitgliedId: member.id,
        },
      },
    });
    if (!eintrag) {
      throw new BadRequestException('Sie sind nicht fuer diese Schicht eingetragen.');
    }

    await this.prisma.festSchichtHelfer.delete({ where: { id: eintrag.id } });
    return { nachricht: 'Erfolgreich aus der Schicht ausgetragen.' };
  }

  // ==================== Einkaufsliste ====================

  async einkaufErstellen(
    tenantId: string,
    eventId: string,
    dto: ErstelleEinkaufDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    return this.prisma.festEinkauf.create({
      data: {
        eventId,
        tenantId,
        artikel: dto.artikel,
        menge: dto.menge ?? null,
        kauftEin: dto.kauftEin ?? null,
      },
    });
  }

  async einkaufAuflisten(tenantId: string, eventId: string) {
    return this.prisma.festEinkauf.findMany({
      where: { eventId, tenantId },
      orderBy: { erstelltAm: 'asc' },
    });
  }

  async einkaufAktualisieren(
    tenantId: string,
    id: string,
    dto: AktualisiereEinkaufDto,
  ) {
    const einkauf = await this.prisma.festEinkauf.findFirst({
      where: { id, tenantId },
    });
    if (!einkauf) {
      throw new NotFoundException('Einkaufsartikel nicht gefunden.');
    }

    return this.prisma.festEinkauf.update({
      where: { id },
      data: {
        ...(dto.artikel !== undefined && { artikel: dto.artikel }),
        ...(dto.menge !== undefined && { menge: dto.menge }),
        ...(dto.kauftEin !== undefined && { kauftEin: dto.kauftEin }),
        ...(dto.erledigt !== undefined && { erledigt: dto.erledigt }),
      },
    });
  }

  async einkaufLoeschen(tenantId: string, id: string) {
    const einkauf = await this.prisma.festEinkauf.findFirst({
      where: { id, tenantId },
    });
    if (!einkauf) {
      throw new NotFoundException('Einkaufsartikel nicht gefunden.');
    }
    await this.prisma.festEinkauf.delete({ where: { id } });
    return { nachricht: 'Einkaufsartikel erfolgreich geloescht.' };
  }

  // ==================== Kasse ====================

  async kasseErstellen(
    tenantId: string,
    eventId: string,
    dto: ErstelleKasseDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    if (dto.betrag <= 0) {
      throw new BadRequestException('Der Betrag muss groesser als 0 sein.');
    }

    return this.prisma.festKasse.create({
      data: {
        eventId,
        tenantId,
        typ: dto.typ,
        betrag: dto.betrag,
        beschreibung: dto.beschreibung,
      },
    });
  }

  async kasseAuflisten(tenantId: string, eventId: string) {
    const eintraege = await this.prisma.festKasse.findMany({
      where: { eventId, tenantId },
      orderBy: { erstelltAm: 'asc' },
    });

    const einnahmen = eintraege
      .filter((e) => e.typ === 'EINNAHME')
      .reduce((sum, e) => sum + e.betrag, 0);
    const ausgaben = eintraege
      .filter((e) => e.typ === 'AUSGABE')
      .reduce((sum, e) => sum + e.betrag, 0);

    return {
      eintraege,
      einnahmen: Math.round(einnahmen * 100) / 100,
      ausgaben: Math.round(ausgaben * 100) / 100,
      saldo: Math.round((einnahmen - ausgaben) * 100) / 100,
    };
  }

  async kasseLoeschen(tenantId: string, id: string) {
    const eintrag = await this.prisma.festKasse.findFirst({
      where: { id, tenantId },
    });
    if (!eintrag) {
      throw new NotFoundException('Kasseneintrag nicht gefunden.');
    }
    await this.prisma.festKasse.delete({ where: { id } });
    return { nachricht: 'Kasseneintrag erfolgreich geloescht.' };
  }

  // ==================== Zusammenfassung ====================

  async zusammenfassung(tenantId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!event) {
      throw new NotFoundException('Veranstaltung nicht gefunden.');
    }

    const [schichten, einkaeufe, kasseResult] = await Promise.all([
      this.schichtenAuflisten(tenantId, eventId),
      this.einkaufAuflisten(tenantId, eventId),
      this.kasseAuflisten(tenantId, eventId),
    ]);

    const helferGesamt = schichten.reduce(
      (sum, s) => sum + s.helfer.length,
      0,
    );
    const helferBenoetigt = schichten.reduce(
      (sum, s) => sum + s.maxHelfer,
      0,
    );
    const einkaufOffen = einkaeufe.filter((e) => !e.erledigt).length;
    const einkaufErledigt = einkaeufe.filter((e) => e.erledigt).length;

    return {
      schichten,
      helferGesamt,
      helferBenoetigt,
      einkaeufe,
      einkaufOffen,
      einkaufErledigt,
      kasse: kasseResult,
    };
  }
}
