import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErstelleTenantDto, AktualisiereTenantDto } from './dto/erstelle-tenant.dto';
import { AktualisiereKiEinstellungenDto } from './dto/ki-einstellungen.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async erstellen(dto: ErstelleTenantDto) {
    const existierend = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existierend) {
      throw new ConflictException('Dieser Slug ist bereits vergeben.');
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        primaryColor: dto.primaryColor,
      },
    });
  }

  async alleAbrufen() {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async nachIdAbrufen(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    return tenant;
  }

  async nachSlugAbrufen(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    return tenant;
  }

  async aktualisieren(id: string, dto: AktualisiereTenantDto) {
    await this.nachIdAbrufen(id); // Pruefen ob existiert

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async logoAktualisieren(id: string, logoUrl: string) {
    await this.nachIdAbrufen(id);

    return this.prisma.tenant.update({
      where: { id },
      data: { logo: logoUrl },
    });
  }

  async loeschen(id: string) {
    await this.nachIdAbrufen(id);

    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  // ==================== KI-Einstellungen ====================

  /**
   * API-Key maskieren: Nur die letzten 4 Zeichen anzeigen.
   */
  private apiKeyMaskieren(key: string | null): string | null {
    if (!key) return null;
    if (key.length <= 4) return '****';
    return '*'.repeat(key.length - 4) + key.slice(-4);
  }

  /**
   * Aktuelle KI-Einstellungen eines Vereins abrufen.
   * Der API-Key wird maskiert zurueckgegeben.
   */
  async kiEinstellungenAbrufen(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { kiProvider: true, kiApiKey: true, kiModell: true },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    return {
      kiProvider: tenant.kiProvider,
      kiApiKey: this.apiKeyMaskieren(tenant.kiApiKey),
      kiModell: tenant.kiModell,
    };
  }

  /**
   * KI-Einstellungen eines Vereins aktualisieren.
   */
  async kiEinstellungenAktualisieren(
    tenantId: string,
    dto: AktualisiereKiEinstellungenDto,
  ) {
    await this.nachIdAbrufen(tenantId);

    const updateData: Record<string, string | null> = {
      kiProvider: dto.kiProvider,
    };

    // API-Key nur aktualisieren, wenn explizit gesendet
    if (dto.kiApiKey !== undefined) {
      updateData.kiApiKey = dto.kiApiKey || null;
    }

    // Modell nur aktualisieren, wenn explizit gesendet
    if (dto.kiModell !== undefined) {
      updateData.kiModell = dto.kiModell || null;
    }

    const aktualisiert = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
      select: { kiProvider: true, kiApiKey: true, kiModell: true },
    });

    return {
      kiProvider: aktualisiert.kiProvider,
      kiApiKey: this.apiKeyMaskieren(aktualisiert.kiApiKey),
      kiModell: aktualisiert.kiModell,
      nachricht: 'KI-Einstellungen erfolgreich aktualisiert.',
    };
  }
}
