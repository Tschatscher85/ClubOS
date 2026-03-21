import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FundingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

// ==================== DTOs ====================

export interface ErstelleProjektDto {
  titel: string;
  beschreibung: string;
  bildUrl?: string;
  zielBetrag: number;
  laufzeitBis: string; // ISO-Datum
  sichtbarkeit?: 'MITGLIEDER' | 'OEFFENTLICH';
}

export interface AktualisiereProjektDto {
  titel?: string;
  beschreibung?: string;
  bildUrl?: string;
  zielBetrag?: number;
  laufzeitBis?: string;
  sichtbarkeit?: 'MITGLIEDER' | 'OEFFENTLICH';
  status?: FundingStatus;
}

export interface SpendeDto {
  betrag: number;
  spenderName?: string;
  spenderEmail?: string;
  anonym?: boolean;
  nachricht?: string;
}

@Injectable()
export class FundingService {
  private readonly logger = new Logger(FundingService.name);

  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  // ==================== Projekt erstellen ====================

  async erstellen(tenantId: string, userId: string, dto: ErstelleProjektDto) {
    if (dto.zielBetrag <= 0) {
      throw new BadRequestException('Zielbetrag muss groesser als 0 sein.');
    }

    const laufzeitBis = new Date(dto.laufzeitBis);
    if (laufzeitBis <= new Date()) {
      throw new BadRequestException('Laufzeit muss in der Zukunft liegen.');
    }

    return this.prisma.fundingProjekt.create({
      data: {
        tenantId,
        titel: dto.titel,
        beschreibung: dto.beschreibung,
        bildUrl: dto.bildUrl,
        zielBetrag: dto.zielBetrag,
        laufzeitBis,
        sichtbarkeit: dto.sichtbarkeit || 'MITGLIEDER',
        erstelltVon: userId,
      },
      include: { spenden: true },
    });
  }

  // ==================== Projekte auflisten ====================

  async auflisten(tenantId: string) {
    return this.prisma.fundingProjekt.findMany({
      where: { tenantId },
      include: {
        spenden: {
          select: {
            id: true,
            betrag: true,
            spenderName: true,
            anonym: true,
            nachricht: true,
            erstelltAm: true,
          },
          orderBy: { erstelltAm: 'desc' },
          take: 5,
        },
        _count: { select: { spenden: true } },
      },
      orderBy: { erstelltAm: 'desc' },
    });
  }

  // ==================== Projekt-Detail ====================

  async detail(tenantId: string, projektId: string) {
    const projekt = await this.prisma.fundingProjekt.findFirst({
      where: { id: projektId, tenantId },
      include: {
        spenden: {
          orderBy: { erstelltAm: 'desc' },
        },
        _count: { select: { spenden: true } },
      },
    });

    if (!projekt) {
      throw new NotFoundException('Crowdfunding-Projekt nicht gefunden.');
    }

    return projekt;
  }

  // ==================== Projekt aktualisieren ====================

  async aktualisieren(tenantId: string, projektId: string, dto: AktualisiereProjektDto) {
    const projekt = await this.prisma.fundingProjekt.findFirst({
      where: { id: projektId, tenantId },
    });

    if (!projekt) {
      throw new NotFoundException('Crowdfunding-Projekt nicht gefunden.');
    }

    return this.prisma.fundingProjekt.update({
      where: { id: projektId },
      data: {
        ...(dto.titel !== undefined && { titel: dto.titel }),
        ...(dto.beschreibung !== undefined && { beschreibung: dto.beschreibung }),
        ...(dto.bildUrl !== undefined && { bildUrl: dto.bildUrl }),
        ...(dto.zielBetrag !== undefined && { zielBetrag: dto.zielBetrag }),
        ...(dto.laufzeitBis !== undefined && { laufzeitBis: new Date(dto.laufzeitBis) }),
        ...(dto.sichtbarkeit !== undefined && { sichtbarkeit: dto.sichtbarkeit }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: { spenden: true },
    });
  }

  // ==================== Projekt loeschen/schliessen ====================

  async loeschen(tenantId: string, projektId: string) {
    const projekt = await this.prisma.fundingProjekt.findFirst({
      where: { id: projektId, tenantId },
    });

    if (!projekt) {
      throw new NotFoundException('Crowdfunding-Projekt nicht gefunden.');
    }

    // Wenn Spenden vorhanden, nur Status auf GESCHLOSSEN setzen
    const spendenAnzahl = await this.prisma.fundingSpende.count({
      where: { projektId },
    });

    if (spendenAnzahl > 0) {
      return this.prisma.fundingProjekt.update({
        where: { id: projektId },
        data: { status: 'GESCHLOSSEN' },
      });
    }

    return this.prisma.fundingProjekt.delete({
      where: { id: projektId },
    });
  }

  // ==================== Spende abgeben ====================

  async spenden(tenantId: string, projektId: string, dto: SpendeDto) {
    const projekt = await this.prisma.fundingProjekt.findFirst({
      where: { id: projektId, tenantId },
    });

    if (!projekt) {
      throw new NotFoundException('Crowdfunding-Projekt nicht gefunden.');
    }

    if (projekt.status !== 'AKTIV') {
      throw new BadRequestException('Dieses Projekt akzeptiert keine Spenden mehr.');
    }

    if (new Date(projekt.laufzeitBis) < new Date()) {
      // Automatisch abgelaufen markieren
      await this.prisma.fundingProjekt.update({
        where: { id: projektId },
        data: { status: 'ABGELAUFEN' },
      });
      throw new BadRequestException('Die Laufzeit dieses Projekts ist abgelaufen.');
    }

    if (dto.betrag <= 0) {
      throw new BadRequestException('Spendenbetrag muss groesser als 0 sein.');
    }

    // Spende erstellen und Betrag aktualisieren
    const [spende, aktualisiertesProjekt] = await this.prisma.$transaction([
      this.prisma.fundingSpende.create({
        data: {
          projektId,
          betrag: dto.betrag,
          spenderName: dto.anonym ? null : dto.spenderName,
          spenderEmail: dto.spenderEmail,
          anonym: dto.anonym ?? false,
          nachricht: dto.nachricht,
        },
      }),
      this.prisma.fundingProjekt.update({
        where: { id: projektId },
        data: {
          aktuellerBetrag: { increment: dto.betrag },
        },
      }),
    ]);

    // Pruefen ob Ziel erreicht
    if (aktualisiertesProjekt.aktuellerBetrag >= aktualisiertesProjekt.zielBetrag) {
      await this.prisma.fundingProjekt.update({
        where: { id: projektId },
        data: { status: 'ERREICHT' },
      });

      // Push-Benachrichtigung an alle Admins
      try {
        const admins = await this.prisma.user.findMany({
          where: { tenantId, role: 'ADMIN', istAktiv: true },
          select: { id: true },
        });
        for (const admin of admins) {
          await this.pushService.sendePush(admin.id, {
            title: `Crowdfunding-Ziel erreicht: "${projekt.titel}"`,
            body: `Das Spendenziel von ${projekt.zielBetrag.toFixed(2)} EUR wurde erreicht!`,
          }).catch(() => {});
        }
      } catch (err) {
        this.logger.warn(`Push-Benachrichtigung fehlgeschlagen: ${err}`);
      }
    }

    return spende;
  }

  // ==================== Oeffentlich laden ====================

  async oeffentlichLaden(slug: string, projektId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, logo: true, primaryColor: true },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    const projekt = await this.prisma.fundingProjekt.findFirst({
      where: {
        id: projektId,
        tenantId: tenant.id,
        sichtbarkeit: 'OEFFENTLICH',
        status: { in: ['AKTIV', 'ERREICHT'] },
      },
      include: {
        spenden: {
          orderBy: { erstelltAm: 'desc' },
          take: 20,
          select: {
            id: true,
            betrag: true,
            spenderName: true,
            anonym: true,
            nachricht: true,
            erstelltAm: true,
          },
        },
        _count: { select: { spenden: true } },
      },
    });

    if (!projekt) {
      throw new NotFoundException('Crowdfunding-Projekt nicht gefunden oder nicht oeffentlich.');
    }

    return { tenant, projekt };
  }

  // ==================== Oeffentlich spenden ====================

  async oeffentlichSpenden(slug: string, projektId: string, dto: SpendeDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    // Pruefen ob Projekt oeffentlich ist
    const projekt = await this.prisma.fundingProjekt.findFirst({
      where: {
        id: projektId,
        tenantId: tenant.id,
        sichtbarkeit: 'OEFFENTLICH',
      },
    });

    if (!projekt) {
      throw new NotFoundException('Crowdfunding-Projekt nicht gefunden oder nicht oeffentlich.');
    }

    return this.spenden(tenant.id, projektId, dto);
  }
}
