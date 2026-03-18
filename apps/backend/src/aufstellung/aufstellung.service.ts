import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleAufstellungDto, AktualisiereAufstellungDto } from './dto/erstelle-aufstellung.dto';

function generiereKurzUrl(): string {
  const zeichen = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let ergebnis = '';
  for (let i = 0; i < 8; i++) {
    ergebnis += zeichen.charAt(Math.floor(Math.random() * zeichen.length));
  }
  return ergebnis;
}

@Injectable()
export class AufstellungService {
  constructor(private prisma: PrismaService) {}

  /** Neue Aufstellung erstellen */
  async erstellen(tenantId: string, dto: ErstelleAufstellungDto) {
    return this.prisma.aufstellung.create({
      data: {
        tenantId,
        teamId: dto.teamId,
        name: dto.name,
        formation: dto.formation,
        positionen: dto.positionen,
        eventId: dto.eventId,
      },
      include: { team: true },
    });
  }

  /** Alle Aufstellungen eines Teams abrufen */
  async alleNachTeam(tenantId: string, teamId: string) {
    return this.prisma.aufstellung.findMany({
      where: { tenantId, teamId },
      orderBy: { erstelltAm: 'desc' },
      include: { team: true },
    });
  }

  /** Einzelne Aufstellung abrufen */
  async nachId(tenantId: string, id: string) {
    const aufstellung = await this.prisma.aufstellung.findFirst({
      where: { id, tenantId },
      include: { team: { include: { teamMembers: { include: { member: true } } } } },
    });

    if (!aufstellung) {
      throw new NotFoundException('Aufstellung nicht gefunden.');
    }

    return aufstellung;
  }

  /** Aufstellung ueber oeffentliche URL abrufen */
  async nachPublicUrl(url: string) {
    const aufstellung = await this.prisma.aufstellung.findUnique({
      where: { publicUrl: url },
      include: { team: { include: { teamMembers: { include: { member: true } } } } },
    });

    if (!aufstellung) {
      throw new NotFoundException('Aufstellung nicht gefunden.');
    }

    return aufstellung;
  }

  /** Aufstellung aktualisieren */
  async aktualisieren(tenantId: string, id: string, dto: AktualisiereAufstellungDto) {
    const aufstellung = await this.prisma.aufstellung.findFirst({
      where: { id, tenantId },
    });

    if (!aufstellung) {
      throw new NotFoundException('Aufstellung nicht gefunden.');
    }

    return this.prisma.aufstellung.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.formation !== undefined && { formation: dto.formation }),
        ...(dto.positionen !== undefined && { positionen: dto.positionen }),
        ...(dto.eventId !== undefined && { eventId: dto.eventId }),
      },
      include: { team: true },
    });
  }

  /** Aufstellung loeschen */
  async loeschen(tenantId: string, id: string) {
    const aufstellung = await this.prisma.aufstellung.findFirst({
      where: { id, tenantId },
    });

    if (!aufstellung) {
      throw new NotFoundException('Aufstellung nicht gefunden.');
    }

    return this.prisma.aufstellung.delete({ where: { id } });
  }

  /** Oeffentliche URL fuer eine Aufstellung generieren */
  async teilen(tenantId: string, id: string) {
    const aufstellung = await this.prisma.aufstellung.findFirst({
      where: { id, tenantId },
    });

    if (!aufstellung) {
      throw new NotFoundException('Aufstellung nicht gefunden.');
    }

    // Falls bereits eine URL existiert, diese zurueckgeben
    if (aufstellung.publicUrl) {
      return { publicUrl: aufstellung.publicUrl };
    }

    // Neue eindeutige URL generieren
    let url = generiereKurzUrl();
    let existiert = await this.prisma.aufstellung.findUnique({ where: { publicUrl: url } });
    while (existiert) {
      url = generiereKurzUrl();
      existiert = await this.prisma.aufstellung.findUnique({ where: { publicUrl: url } });
    }

    await this.prisma.aufstellung.update({
      where: { id },
      data: { publicUrl: url },
    });

    return { publicUrl: url };
  }
}
