import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EinladungStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import { ErstelleEinladungDto } from './dto/erstelle-einladung.dto';

@Injectable()
export class EinladungService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  /**
   * Neue Einladung erstellen und E-Mail versenden.
   * Wenn eine workflowId angegeben ist, werden templateIds und sportarten
   * aus dem Workflow uebernommen (koennen aber ueberschrieben werden).
   */
  async einladen(tenantId: string, userId: string, dto: ErstelleEinladungDto) {
    const token = randomUUID();

    let templateIds = dto.templateIds ?? [];
    let sportarten = dto.sportarten ?? [];
    let workflowId: string | null = null;

    // Workflow laden und Daten uebernehmen
    if (dto.workflowId) {
      const workflow = await this.prisma.workflow.findFirst({
        where: { id: dto.workflowId, tenantId, istAktiv: true },
      });

      if (!workflow) {
        throw new NotFoundException('Workflow nicht gefunden oder inaktiv.');
      }

      // Workflow-Daten als Basis, DTO-Daten ueberschreiben falls vorhanden
      templateIds = dto.templateIds?.length ? dto.templateIds : workflow.templateIds;
      sportarten = dto.sportarten?.length ? dto.sportarten : workflow.sportarten;
      workflowId = workflow.id;
    }

    // Tenant-Name fuer die E-Mail abrufen
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    // Einladung in der Datenbank speichern
    const einladung = await this.prisma.einladung.create({
      data: {
        tenantId,
        token,
        vorname: dto.vorname,
        nachname: dto.nachname,
        email: dto.email,
        templateIds,
        sportarten,
        geburtsdatum: dto.geburtsdatum ?? null,
        workflowId,
        eingeladenVon: userId,
        status: EinladungStatus.GESENDET,
      },
    });

    // Einladungslink erstellen
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const link = `${frontendUrl}/einladung/${token}`;

    // E-Mail versenden (mit persoenlichem SMTP des Absenders, falls konfiguriert)
    await this.mailService.einladungSenden(
      dto.email,
      dto.vorname,
      tenant.name,
      link,
      templateIds.length,
      userId,
    );

    return {
      ...einladung,
      link,
    };
  }

  /**
   * Alle Einladungen eines Vereins abrufen.
   */
  async alleAbrufen(tenantId: string) {
    return this.prisma.einladung.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Einladung anhand des Tokens abrufen (oeffentlich, kein Auth).
   * Setzt den Status auf GEOEFFNET, falls er noch GESENDET ist.
   */
  async einladungAbrufen(token: string) {
    const einladung = await this.prisma.einladung.findUnique({
      where: { token },
    });

    if (!einladung) {
      throw new NotFoundException('Einladung nicht gefunden oder abgelaufen.');
    }

    // 30-Tage-Ablauf pruefen
    const dreissigTage = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - einladung.createdAt.getTime() > dreissigTage) {
      if (einladung.status !== EinladungStatus.ABGELAUFEN) {
        await this.prisma.einladung.update({
          where: { token },
          data: { status: EinladungStatus.ABGELAUFEN },
        });
      }
      throw new NotFoundException('Einladung ist abgelaufen.');
    }

    // Status von GESENDET auf GEOEFFNET aktualisieren
    if (einladung.status === EinladungStatus.GESENDET) {
      const aktualisiert = await this.prisma.einladung.update({
        where: { token },
        data: { status: EinladungStatus.GEOEFFNET },
      });

      return this.mitDetails(aktualisiert.id);
    }

    return this.mitDetails(einladung.id);
  }

  /**
   * Einladung als ausgefuellt markieren.
   */
  async alsAusgefuellt(token: string) {
    const einladung = await this.prisma.einladung.findUnique({
      where: { token },
    });

    if (!einladung) {
      throw new NotFoundException('Einladung nicht gefunden.');
    }

    return this.prisma.einladung.update({
      where: { token },
      data: { status: EinladungStatus.AUSGEFUELLT },
    });
  }

  /**
   * Einladung mit Tenant-, Template- und Formular-Daten laden.
   * Laedt alle zugewiesenen Formularvorlagen.
   */
  private async mitDetails(einladungId: string) {
    const einladung = await this.prisma.einladung.findUnique({
      where: { id: einladungId },
    });

    if (!einladung) {
      throw new NotFoundException('Einladung nicht gefunden.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: einladung.tenantId },
      select: { name: true, logo: true, primaryColor: true },
    });

    // Alle zugewiesenen Formularvorlagen laden
    let templates: Array<{
      id: string;
      name: string;
      type: string;
      fields: unknown;
    }> = [];

    if (einladung.templateIds.length > 0) {
      templates = await this.prisma.formTemplate.findMany({
        where: { id: { in: einladung.templateIds } },
        select: { id: true, name: true, type: true, fields: true },
      });
    }

    return {
      ...einladung,
      tenant,
      templates,
    };
  }
}
