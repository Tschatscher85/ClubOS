import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EinladungStatus, Prisma, SubmissionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import { ErstelleEinladungDto } from './dto/erstelle-einladung.dto';
import { OeffentlicheEinreichungDto } from './dto/einreichung.dto';

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
   * Oeffentlich: Einladung per Token laden inkl. Formularvorlagen.
   * Prueft Ablauf und setzt Status auf GEOEFFNET.
   */
  async oeffentlichLaden(token: string) {
    return this.einladungAbrufen(token);
  }

  /**
   * Oeffentlich: Formulare einreichen mit Signatur.
   * 1. Token validieren (nicht abgelaufen, nicht bereits ausgefuellt)
   * 2. FormSubmission(s) erstellen mit Daten + signaturDatenUrl
   * 3. Status auf AUSGEFUELLT setzen
   * 4. HTML-Quittung generieren und auf Disk schreiben
   * 5. Erfolg zurueckgeben
   */
  async einreichen(token: string, dto: OeffentlicheEinreichungDto) {
    // 1. Token validieren
    const einladung = await this.prisma.einladung.findUnique({
      where: { token },
    });

    if (!einladung) {
      throw new NotFoundException('Einladung nicht gefunden.');
    }

    // Ablauf pruefen (30 Tage)
    const dreissigTage = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - einladung.createdAt.getTime() > dreissigTage) {
      if (einladung.status !== EinladungStatus.ABGELAUFEN) {
        await this.prisma.einladung.update({
          where: { token },
          data: { status: EinladungStatus.ABGELAUFEN },
        });
      }
      throw new BadRequestException('Einladung ist abgelaufen.');
    }

    // Bereits ausgefuellt?
    if (einladung.status === EinladungStatus.AUSGEFUELLT) {
      throw new BadRequestException('Einladung wurde bereits ausgefuellt.');
    }

    // Templates laden
    let templates: Array<{
      id: string;
      name: string;
      type: string;
      fields: unknown;
      nurKenntnisnahme?: boolean;
      fileUrl?: string;
    }> = [];

    if (einladung.templateIds.length > 0) {
      templates = await this.prisma.formTemplate.findMany({
        where: { id: { in: einladung.templateIds } },
        select: { id: true, name: true, type: true, fields: true, nurKenntnisnahme: true, fileUrl: true },
      });
    }

    // 2. FormSubmission(s) erstellen
    const einreichungen: Array<{ id: string; templateName: string }> = [];

    for (const template of templates) {
      // Bei Kenntnisnahme-Templates nur Bestaetigung speichern
      const istKenntnisnahme = template.nurKenntnisnahme === true;
      const daten = istKenntnisnahme
        ? { kenntnisGenommen: true, bestaetigtAm: new Date().toISOString() }
        : (dto.formulardaten[template.id] || {});
      const signatur = istKenntnisnahme ? null : (dto.unterschriften[template.id] || null);

      // Sportarten in die Daten einfuegen
      const formDaten = {
        ...daten,
        sportarten: dto.sportarten || einladung.sportarten,
      };

      const submission = await this.prisma.formSubmission.create({
        data: {
          tenantId: einladung.tenantId,
          templateId: template.id,
          email: dto.email,
          daten: formDaten as unknown as Prisma.InputJsonValue,
          signatureUrl: signatur,
          signaturDatenUrl: signatur,
          status: SubmissionStatus.EINGEREICHT,
        },
      });

      einreichungen.push({
        id: submission.id,
        templateName: template.name,
      });
    }

    // 3. Einladung als ausgefuellt markieren
    await this.prisma.einladung.update({
      where: { token },
      data: { status: EinladungStatus.AUSGEFUELLT },
    });

    // 4. HTML-Quittung generieren und auf Disk schreiben
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: einladung.tenantId },
      select: { name: true, primaryColor: true },
    });

    const quittungHtml = this.quittungErstellen(
      einladung.vorname,
      einladung.nachname,
      dto.email,
      tenant?.name || 'Unbekannter Verein',
      tenant?.primaryColor || '#1a56db',
      templates,
      dto.formulardaten,
      dto.unterschriften,
    );

    // Quittung auf Disk speichern
    const quittungVerzeichnis = path.join(
      process.cwd(),
      'uploads',
      'quittungen',
    );
    if (!fs.existsSync(quittungVerzeichnis)) {
      fs.mkdirSync(quittungVerzeichnis, { recursive: true });
    }

    const dateiName = `quittung_${token}_${Date.now()}.html`;
    const dateiPfad = path.join(quittungVerzeichnis, dateiName);
    fs.writeFileSync(dateiPfad, quittungHtml, 'utf-8');

    // 5. Erfolg zurueckgeben
    return {
      erfolg: true,
      nachricht: `${einreichungen.length} Formular(e) erfolgreich eingereicht.`,
      einreichungen,
      quittungDatei: dateiName,
    };
  }

  /**
   * Generiert eine HTML-Quittung fuer die eingereichten Formulare.
   */
  private quittungErstellen(
    vorname: string,
    nachname: string,
    email: string,
    vereinsname: string,
    vereinsfarbe: string,
    templates: Array<{ id: string; name: string; type: string; fields: unknown }>,
    formulardaten: Record<string, Record<string, unknown>>,
    unterschriften: Record<string, string>,
  ): string {
    const datum = new Date().toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const formulareHtml = templates
      .map((template) => {
        const daten = formulardaten[template.id] || {};
        const felder = template.fields as Array<{ name: string; label: string }>;
        const signatur = unterschriften[template.id];

        const felderHtml = felder
          .map((feld) => {
            const wert = daten[feld.name] ?? '';
            const wertAnzeige =
              typeof wert === 'object' ? JSON.stringify(wert) : String(wert);
            return `
            <tr>
              <td class="label">${this.escapeHtml(feld.label)}</td>
              <td class="wert">${this.escapeHtml(wertAnzeige) || '<span class="leer">- nicht ausgefuellt -</span>'}</td>
            </tr>`;
          })
          .join('\n');

        const signaturHtml = signatur
          ? `
          <div class="unterschrift-bereich">
            <h4>Unterschrift</h4>
            <img src="${this.escapeHtml(signatur)}" alt="Digitale Unterschrift" class="unterschrift-bild" />
          </div>`
          : '';

        return `
        <div class="formular-abschnitt">
          <h3>${this.escapeHtml(template.name)}</h3>
          <table>${felderHtml}</table>
          ${signaturHtml}
        </div>`;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Einreichungsquittung - ${this.escapeHtml(vereinsname)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      background: #f5f5f5;
      padding: 20px;
    }
    .dokument {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #d1d5db;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .kopfzeile {
      background: ${this.escapeHtml(vereinsfarbe)};
      color: #ffffff;
      padding: 24px 32px;
    }
    .kopfzeile h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .kopfzeile .vereinsname { font-size: 14px; opacity: 0.9; }
    .meta-bereich {
      padding: 16px 32px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
      color: #6b7280;
    }
    .inhalt { padding: 24px 32px; }
    .formular-abschnitt {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e7eb;
    }
    .formular-abschnitt:last-child { border-bottom: none; }
    .formular-abschnitt h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #374151;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    table tr { border-bottom: 1px solid #f3f4f6; }
    table tr:last-child { border-bottom: none; }
    td { padding: 8px 12px; vertical-align: top; font-size: 14px; }
    td.label { width: 40%; font-weight: 600; color: #374151; background: #f9fafb; }
    td.wert { color: #1f2937; }
    .leer { color: #9ca3af; font-style: italic; }
    .unterschrift-bereich { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e5e7eb; }
    .unterschrift-bereich h4 { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
    .unterschrift-bild { max-width: 250px; max-height: 100px; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px; background: #fff; }
    .erfolg-banner {
      background: #d1fae5;
      color: #065f46;
      padding: 16px 32px;
      font-weight: 600;
      text-align: center;
      font-size: 15px;
    }
    .fusszeile {
      padding: 16px 32px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .dokument { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <div class="dokument">
    <div class="kopfzeile">
      <h1>Einreichungsquittung</h1>
      <div class="vereinsname">${this.escapeHtml(vereinsname)}</div>
    </div>
    <div class="erfolg-banner">
      Alle Formulare wurden erfolgreich eingereicht.
    </div>
    <div class="meta-bereich">
      <strong>Name:</strong> ${this.escapeHtml(vorname)} ${this.escapeHtml(nachname)}
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <strong>E-Mail:</strong> ${this.escapeHtml(email)}
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <strong>Eingereicht am:</strong> ${datum}
    </div>
    <div class="inhalt">
      ${formulareHtml}
    </div>
    <div class="fusszeile">
      Erstellt mit Vereinbase &mdash; ${this.escapeHtml(vereinsname)} &mdash; ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
    </div>
  </div>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
        select: { id: true, name: true, type: true, fields: true, nurKenntnisnahme: true, fileUrl: true },
      });
    }

    return {
      ...einladung,
      tenant,
      templates,
    };
  }
}
