import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SubmissionStatus } from '@prisma/client';
import {
  ErstelleTemplateDto,
  ErstelleSubmissionDto,
} from './dto/erstelle-submission.dto';

@Injectable()
export class FormService {
  constructor(private prisma: PrismaService) {}

  // ==================== Templates ====================

  async templateAbrufen(tenantId: string, templateId: string) {
    const template = await this.prisma.formTemplate.findFirst({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Formularvorlage nicht gefunden.');
    }

    return template;
  }

  async alleTemplatesAbrufen(tenantId: string) {
    return this.prisma.formTemplate.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { submissions: true } },
      },
    });
  }

  async templateErstellen(tenantId: string, dto: ErstelleTemplateDto) {
    return this.prisma.formTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.typ,
        fields: dto.felder as unknown as Prisma.InputJsonValue,
        fileUrl: '', // Wird spaeter bei PDF-Upload gesetzt
      },
    });
  }

  async templateAktualisieren(tenantId: string, templateId: string, dto: Partial<ErstelleTemplateDto>) {
    const template = await this.prisma.formTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!template) {
      throw new NotFoundException('Formularvorlage nicht gefunden.');
    }

    return this.prisma.formTemplate.update({
      where: { id: templateId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.typ !== undefined && { type: dto.typ }),
        ...(dto.felder !== undefined && { fields: dto.felder as unknown as Prisma.InputJsonValue }),
      },
    });
  }

  async templateLoeschen(tenantId: string, templateId: string) {
    const template = await this.prisma.formTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!template) {
      throw new NotFoundException('Formularvorlage nicht gefunden.');
    }

    // Soft delete - deaktivieren statt loeschen (Einreichungen bleiben erhalten)
    return this.prisma.formTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });
  }

  // ==================== Einreichungen ====================

  async einreichen(
    tenantId: string,
    templateId: string,
    dto: ErstelleSubmissionDto,
  ) {
    // Pruefen ob Template existiert und aktiv ist
    const template = await this.prisma.formTemplate.findFirst({
      where: { id: templateId, tenantId, isActive: true },
    });

    if (!template) {
      throw new NotFoundException(
        'Formularvorlage nicht gefunden oder nicht aktiv.',
      );
    }

    return this.prisma.formSubmission.create({
      data: {
        tenantId,
        templateId,
        email: dto.email,
        daten: dto.daten as unknown as Prisma.InputJsonValue,
        signatureUrl: dto.signatureUrl,
        eingereichtVon: dto.eingereichtVon,
        status: SubmissionStatus.EINGEREICHT,
      },
      include: {
        template: { select: { name: true, type: true } },
      },
    });
  }

  async alleEinreichungenAbrufen(tenantId: string, templateId?: string) {
    const where: { tenantId: string; templateId?: string } = { tenantId };
    if (templateId) {
      where.templateId = templateId;
    }

    return this.prisma.formSubmission.findMany({
      where,
      include: {
        template: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async einreichungAbrufen(tenantId: string, id: string) {
    const einreichung = await this.prisma.formSubmission.findFirst({
      where: { id, tenantId },
      include: {
        template: true,
      },
    });

    if (!einreichung) {
      throw new NotFoundException('Einreichung nicht gefunden.');
    }

    return einreichung;
  }

  async statusAendern(
    tenantId: string,
    id: string,
    neuerStatus: SubmissionStatus,
    kommentar?: string,
  ) {
    const einreichung = await this.einreichungAbrufen(tenantId, id);

    const aktualisiert = await this.prisma.formSubmission.update({
      where: { id: einreichung.id },
      data: {
        status: neuerStatus,
        kommentar: kommentar ?? einreichung.kommentar,
      },
      include: {
        template: { select: { name: true, type: true } },
      },
    });

    // Bei Genehmigung automatisch Mitglied anlegen
    if (neuerStatus === SubmissionStatus.GENEHMIGT) {
      await this.mitgliedAusDatenErstellen(tenantId, einreichung.daten as Record<string, unknown>, einreichung.email);
    }

    return aktualisiert;
  }

  async einreichungAlsPdf(tenantId: string, id: string) {
    const einreichung = await this.prisma.formSubmission.findFirst({
      where: { id, tenantId },
      include: { template: true },
    });

    if (!einreichung) {
      throw new NotFoundException('Einreichung nicht gefunden.');
    }

    const daten = einreichung.daten as Record<string, unknown>;
    const felder = einreichung.template.fields as unknown as Array<{
      name: string;
      label: string;
    }>;

    // Strukturierte Daten fuer spaetere PDF-Generierung
    const pdfDaten = {
      titel: einreichung.template.name,
      typ: einreichung.template.type,
      eingereichtAm: einreichung.createdAt,
      email: einreichung.email,
      status: einreichung.status,
      felder: felder.map((feld) => ({
        label: feld.label,
        wert: daten[feld.name] ?? '',
      })),
      unterschrift: einreichung.signatureUrl ? true : false,
    };

    return pdfDaten;
  }

  async templatePdfUrlSetzen(templateId: string, pdfUrl: string) {
    return this.prisma.formTemplate.update({
      where: { id: templateId },
      data: { fileUrl: pdfUrl },
    });
  }

  // ==================== Hilfsmethoden ====================

  private async mitgliedAusDatenErstellen(
    tenantId: string,
    daten: Record<string, unknown>,
    email: string,
  ) {
    const vorname =
      (daten['vorname'] as string) ||
      (daten['firstName'] as string) ||
      'Unbekannt';
    const nachname =
      (daten['nachname'] as string) ||
      (daten['lastName'] as string) ||
      'Unbekannt';

    // Mitgliedsnummer generieren
    const anzahl = await this.prisma.member.count({ where: { tenantId } });
    const mitgliedsnummer = `M-${String(anzahl + 1).padStart(5, '0')}`;

    // Pruefen ob Mitglied mit dieser E-Mail bereits existiert
    const bestehendesMitglied = await this.prisma.member.findFirst({
      where: {
        tenantId,
        OR: [
          { email },
          { user: { email } },
        ],
      },
    });

    if (bestehendesMitglied) {
      return bestehendesMitglied;
    }

    // Sportarten aus den Daten extrahieren
    const sportarten = (daten['sportarten'] as string[]) || [];

    return this.prisma.member.create({
      data: {
        tenantId,
        firstName: vorname,
        lastName: nachname,
        email,
        memberNumber: mitgliedsnummer,
        phone: (daten['telefon'] as string) || (daten['phone'] as string),
        address: (daten['adresse'] as string) || (daten['address'] as string),
        birthDate: daten['geburtsdatum']
          ? new Date(daten['geburtsdatum'] as string)
          : undefined,
        sport: sportarten,
        parentEmail: (daten['elternEmail'] as string) || undefined,
        status: 'ACTIVE',
      },
    });
  }
}
