import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleSponsorDto, AktualisiereSponsorDto } from './dto/erstelle-sponsor.dto';

@Injectable()
export class SponsorService {
  constructor(private prisma: PrismaService) {}

  /** Neuen Sponsor erstellen */
  async sponsorErstellen(tenantId: string, dto: ErstelleSponsorDto) {
    return this.prisma.sponsor.create({
      data: {
        tenantId,
        name: dto.name,
        logoUrl: dto.logoUrl,
        webseite: dto.webseite,
        beschreibung: dto.beschreibung,
        kontaktName: dto.kontaktName,
        kontaktEmail: dto.kontaktEmail,
        loginEmail: dto.loginEmail,
        paketName: dto.paketName,
        betrag: dto.betrag,
        vertragStart: dto.vertragStart ? new Date(dto.vertragStart) : undefined,
        vertragEnde: dto.vertragEnde ? new Date(dto.vertragEnde) : undefined,
        sichtbarkeit: dto.sichtbarkeit || [],
      },
    });
  }

  /** Alle Sponsoren eines Vereins abrufen */
  async alleAbrufen(tenantId: string, nurAktive = false) {
    return this.prisma.sponsor.findMany({
      where: {
        tenantId,
        ...(nurAktive ? { istAktiv: true } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Einzelnen Sponsor abrufen */
  async sponsorAbrufen(tenantId: string, id: string) {
    const sponsor = await this.prisma.sponsor.findFirst({
      where: { id, tenantId },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor nicht gefunden.');
    }

    return sponsor;
  }

  /** Sponsor aktualisieren */
  async aktualisieren(tenantId: string, id: string, dto: AktualisiereSponsorDto) {
    const sponsor = await this.prisma.sponsor.findFirst({
      where: { id, tenantId },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor nicht gefunden.');
    }

    return this.prisma.sponsor.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.webseite !== undefined && { webseite: dto.webseite }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
        ...(dto.kontaktName !== undefined && { kontaktName: dto.kontaktName }),
        ...(dto.kontaktEmail !== undefined && { kontaktEmail: dto.kontaktEmail }),
        ...(dto.istAktiv !== undefined && { istAktiv: dto.istAktiv }),
        ...(dto.loginEmail !== undefined && { loginEmail: dto.loginEmail }),
        ...(dto.paketName !== undefined && { paketName: dto.paketName }),
        ...(dto.betrag !== undefined && { betrag: dto.betrag }),
        ...(dto.vertragStart !== undefined && { vertragStart: new Date(dto.vertragStart) }),
        ...(dto.vertragEnde !== undefined && { vertragEnde: new Date(dto.vertragEnde) }),
        ...(dto.sichtbarkeit !== undefined && { sichtbarkeit: dto.sichtbarkeit }),
      },
    });
  }

  /** Sponsor loeschen */
  async loeschen(tenantId: string, id: string) {
    const sponsor = await this.prisma.sponsor.findFirst({
      where: { id, tenantId },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor nicht gefunden.');
    }

    return this.prisma.sponsor.delete({ where: { id } });
  }
}
