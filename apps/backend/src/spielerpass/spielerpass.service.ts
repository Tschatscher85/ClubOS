import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface ErstelleSpielerpassDto {
  passNummer?: string;
  sportart?: string;
  altersklasse?: string;
  gueltigBis?: string; // ISO date
  spielberechtigt?: boolean;
  gesperrt?: boolean;
  sperrgrund?: string;
}

export interface AktualisiereSpielerpassDto {
  passNummer?: string;
  sportart?: string;
  altersklasse?: string;
  gueltigBis?: string | null;
  spielberechtigt?: boolean;
  gesperrt?: boolean;
  sperrgrund?: string | null;
}

@Injectable()
export class SpielerpassService {
  constructor(private prisma: PrismaService) {}

  /**
   * Erstellt einen neuen Spielerpass fuer ein Mitglied.
   */
  async erstellen(
    tenantId: string,
    memberId: string,
    dto: ErstelleSpielerpassDto,
  ) {
    // Pruefen ob Mitglied existiert und zum Tenant gehoert
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) {
      throw new NotFoundException('Mitglied nicht gefunden.');
    }

    // Eindeutigen QR-Token generieren
    const qrToken = randomBytes(16).toString('hex');

    return this.prisma.spielerpass.create({
      data: {
        memberId,
        tenantId,
        qrToken,
        passNummer: dto.passNummer || null,
        sportart: dto.sportart || null,
        altersklasse: dto.altersklasse || null,
        gueltigBis: dto.gueltigBis ? new Date(dto.gueltigBis) : null,
        spielberechtigt: dto.spielberechtigt ?? true,
        gesperrt: dto.gesperrt ?? false,
        sperrgrund: dto.sperrgrund || null,
      },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Ruft den Spielerpass eines Mitglieds ab.
   */
  async abrufen(tenantId: string, memberId: string) {
    const pass = await this.prisma.spielerpass.findFirst({
      where: { memberId, tenantId },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!pass) {
      throw new NotFoundException('Spielerpass nicht gefunden.');
    }

    return pass;
  }

  /**
   * Aktualisiert einen bestehenden Spielerpass.
   */
  async aktualisieren(
    tenantId: string,
    memberId: string,
    dto: AktualisiereSpielerpassDto,
  ) {
    const pass = await this.prisma.spielerpass.findFirst({
      where: { memberId, tenantId },
    });

    if (!pass) {
      throw new NotFoundException('Spielerpass nicht gefunden.');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.passNummer !== undefined) updateData['passNummer'] = dto.passNummer || null;
    if (dto.sportart !== undefined) updateData['sportart'] = dto.sportart || null;
    if (dto.altersklasse !== undefined) updateData['altersklasse'] = dto.altersklasse || null;
    if (dto.gueltigBis !== undefined)
      updateData['gueltigBis'] = dto.gueltigBis ? new Date(dto.gueltigBis) : null;
    if (dto.spielberechtigt !== undefined) updateData['spielberechtigt'] = dto.spielberechtigt;
    if (dto.gesperrt !== undefined) updateData['gesperrt'] = dto.gesperrt;
    if (dto.sperrgrund !== undefined) updateData['sperrgrund'] = dto.sperrgrund || null;

    return this.prisma.spielerpass.update({
      where: { id: pass.id },
      data: updateData,
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Oeffentliche Pruefung eines Spielerpasses via QR-Token.
   * Gibt nur die fuer die Verifizierung relevanten Daten zurueck.
   */
  async pruefen(qrToken: string) {
    const pass = await this.prisma.spielerpass.findUnique({
      where: { qrToken },
      include: {
        member: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!pass) {
      throw new NotFoundException('Spielerpass nicht gefunden oder ungueltiger QR-Code.');
    }

    return {
      name: `${pass.member.firstName} ${pass.member.lastName}`,
      sportart: pass.sportart,
      altersklasse: pass.altersklasse,
      spielberechtigt: pass.spielberechtigt,
      gesperrt: pass.gesperrt,
      sperrgrund: pass.gesperrt ? pass.sperrgrund : null,
      gueltigBis: pass.gueltigBis,
    };
  }

  /**
   * Loescht einen Spielerpass.
   */
  async loeschen(tenantId: string, memberId: string) {
    const pass = await this.prisma.spielerpass.findFirst({
      where: { memberId, tenantId },
    });

    if (!pass) {
      throw new NotFoundException('Spielerpass nicht gefunden.');
    }

    await this.prisma.spielerpass.delete({ where: { id: pass.id } });
  }
}
