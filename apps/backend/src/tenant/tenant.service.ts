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

  /**
   * Oeffentliches Branding eines Vereins anhand des Slugs abrufen.
   * Wird vom Frontend genutzt, um Branding vor dem Login zu laden.
   */
  async brandingAbrufen(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        name: true,
        logo: true,
        primaryColor: true,
        slug: true,
      },
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

    // API-Key nur aktualisieren, wenn explizit gesendet und nicht maskiert
    if (dto.kiApiKey !== undefined) {
      const istMaskiert = dto.kiApiKey && /^\*+/.test(dto.kiApiKey);
      if (!istMaskiert) {
        updateData.kiApiKey = dto.kiApiKey || null;
      }
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

  // ==================== Vereinsdaten / Rechtliches ====================

  async vereinsdatenAbrufen(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        vereinsNr: true,
        amtsgericht: true,
        gruendungsjahr: true,
        anschrift: true,
        plz: true,
        ort: true,
        bundesland: true,
        telefon: true,
        email: true,
        webseite: true,
        vorstand1Name: true,
        vorstand1Funktion: true,
        vorstand2Name: true,
        vorstand2Funktion: true,
        kassenwart: true,
        schriftfuehrer: true,
        jugendwart: true,
        satzungUrl: true,
        satzungDatum: true,
        impressum: true,
        datenschutzUrl: true,
        datenschutzText: true,
        haftpflichtVersicherung: true,
        haftpflichtPoliceNr: true,
        haftpflichtGueltigBis: true,
        unfallVersicherung: true,
        unfallPoliceNr: true,
        unfallGueltigBis: true,
        gewaehrleistungsVersicherung: true,
        steuernummer: true,
        finanzamt: true,
        gemeinnuetzigBis: true,
        gemeinnuetzigUrl: true,
        iban: true,
        bic: true,
        bankName: true,
        landessportbund: true,
        sportverband: true,
        verbandsMitgliedsNr: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    return tenant;
  }

  async vereinsdatenAktualisieren(
    tenantId: string,
    daten: Record<string, unknown>,
  ) {
    await this.nachIdAbrufen(tenantId);

    // Nur erlaubte Felder durchlassen
    const erlaubteFelder = [
      'vereinsNr', 'amtsgericht', 'gruendungsjahr', 'anschrift', 'plz', 'ort',
      'bundesland', 'telefon', 'email', 'webseite',
      'vorstand1Name', 'vorstand1Funktion', 'vorstand2Name', 'vorstand2Funktion',
      'kassenwart', 'schriftfuehrer', 'jugendwart',
      'satzungUrl', 'satzungDatum', 'impressum', 'datenschutzUrl', 'datenschutzText',
      'haftpflichtVersicherung', 'haftpflichtPoliceNr', 'haftpflichtGueltigBis',
      'unfallVersicherung', 'unfallPoliceNr', 'unfallGueltigBis',
      'gewaehrleistungsVersicherung',
      'steuernummer', 'finanzamt', 'gemeinnuetzigBis', 'gemeinnuetzigUrl',
      'iban', 'bic', 'bankName',
      'landessportbund', 'sportverband', 'verbandsMitgliedsNr',
    ];

    const gefilterteDaten: Record<string, unknown> = {};
    for (const feld of erlaubteFelder) {
      if (daten[feld] !== undefined) {
        gefilterteDaten[feld] = daten[feld];
      }
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: gefilterteDaten,
    });
  }

  // ==================== SMTP (Vereins-Mailserver) ====================

  async smtpAbrufen(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPass: true,
        smtpAbsenderEmail: true,
        smtpAbsenderName: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    return {
      ...tenant,
      smtpPass: tenant.smtpPass ? '********' : null, // Passwort maskieren
    };
  }

  async smtpSpeichern(
    tenantId: string,
    daten: {
      smtpHost: string;
      smtpPort?: number;
      smtpUser: string;
      smtpPass?: string;
      smtpAbsenderEmail: string;
      smtpAbsenderName?: string;
    },
  ) {
    await this.nachIdAbrufen(tenantId);

    const updateData: Record<string, unknown> = {
      smtpHost: daten.smtpHost,
      smtpUser: daten.smtpUser,
      smtpAbsenderEmail: daten.smtpAbsenderEmail,
    };

    if (daten.smtpPort) updateData.smtpPort = daten.smtpPort;
    if (daten.smtpAbsenderName) updateData.smtpAbsenderName = daten.smtpAbsenderName;
    if (daten.smtpPass) {
      updateData.smtpPass = Buffer.from(daten.smtpPass).toString('base64');
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return { nachricht: 'SMTP-Einstellungen gespeichert.' };
  }

  // ==================== Altersklassen ====================

  private static readonly STANDARD_ALTERSKLASSEN = [
    'Bambini', 'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12',
    'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19',
    'Senioren', 'AH',
  ];

  async altersklassenAbrufen(tenantId: string): Promise<string[]> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { altersklassen: true },
    });
    // Wenn leer: Standard-Altersklassen zurueckgeben
    if (!tenant?.altersklassen || tenant.altersklassen.length === 0) {
      return TenantService.STANDARD_ALTERSKLASSEN;
    }
    return tenant.altersklassen;
  }

  async altersklassenSetzen(tenantId: string, altersklassen: string[]) {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { altersklassen },
    });
    return { nachricht: 'Altersklassen gespeichert.', altersklassen };
  }

  // ==================== Veranstaltungstypen ====================

  private static readonly STANDARD_VERANSTALTUNGSTYPEN = [
    { wert: 'TRAINING', label: 'Training' },
    { wert: 'MATCH', label: 'Spiel' },
    { wert: 'TOURNAMENT', label: 'Turnier' },
    { wert: 'EVENT', label: 'Veranstaltung' },
    { wert: 'VOLUNTEER', label: 'Helfereinsatz' },
    { wert: 'TRIP', label: 'Ausflug' },
    { wert: 'MEETING', label: 'Besprechung' },
  ];

  async veranstaltungstypenAbrufen(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { veranstaltungsTypen: true },
    });
    if (!tenant?.veranstaltungsTypen || tenant.veranstaltungsTypen.length === 0) {
      return TenantService.STANDARD_VERANSTALTUNGSTYPEN;
    }
    // Gespeichert als JSON-Strings
    try {
      return tenant.veranstaltungsTypen.map((t) => JSON.parse(t));
    } catch {
      return TenantService.STANDARD_VERANSTALTUNGSTYPEN;
    }
  }

  async veranstaltungstypenSetzen(tenantId: string, typen: Array<{ wert: string; label: string }>) {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { veranstaltungsTypen: typen.map((t) => JSON.stringify(t)) },
    });
    return { nachricht: 'Veranstaltungstypen gespeichert.', typen };
  }
}
