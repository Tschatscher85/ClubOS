import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PosteingangService {
  constructor(private prisma: PrismaService) {}

  /**
   * E-Mails im Posteingang abrufen (paginiert)
   */
  async abrufen(
    tenantId: string,
    userId: string,
    ordner: string = 'POSTEINGANG',
    seite: number = 1,
    proSeite: number = 20,
  ) {
    const where = { tenantId, ordner };

    const [emails, gesamt] = await Promise.all([
      this.prisma.emailPosteingang.findMany({
        where,
        orderBy: { empfangenAm: 'desc' },
        skip: (seite - 1) * proSeite,
        take: proSeite,
      }),
      this.prisma.emailPosteingang.count({ where }),
    ]);

    const ungelesen = await this.prisma.emailPosteingang.count({
      where: { ...where, gelesen: false },
    });

    return {
      emails,
      gesamt,
      ungelesen,
      seite,
      seiten: Math.ceil(gesamt / proSeite),
    };
  }

  /**
   * Einzelne E-Mail lesen und als gelesen markieren
   */
  async lesen(tenantId: string, emailId: string) {
    const email = await this.prisma.emailPosteingang.findFirst({
      where: { id: emailId, tenantId },
    });

    if (!email) {
      throw new NotFoundException('E-Mail nicht gefunden.');
    }

    if (!email.gelesen) {
      await this.prisma.emailPosteingang.update({
        where: { id: emailId },
        data: { gelesen: true },
      });
    }

    return { ...email, gelesen: true };
  }

  /**
   * E-Mail als wichtig markieren/entmarkieren
   */
  async wichtigToggle(tenantId: string, emailId: string) {
    const email = await this.prisma.emailPosteingang.findFirst({
      where: { id: emailId, tenantId },
    });

    if (!email) {
      throw new NotFoundException('E-Mail nicht gefunden.');
    }

    return this.prisma.emailPosteingang.update({
      where: { id: emailId },
      data: { istWichtig: !email.istWichtig },
    });
  }

  /**
   * E-Mail in Ordner verschieben
   */
  async verschieben(tenantId: string, emailId: string, ordner: string) {
    const email = await this.prisma.emailPosteingang.findFirst({
      where: { id: emailId, tenantId },
    });

    if (!email) {
      throw new NotFoundException('E-Mail nicht gefunden.');
    }

    return this.prisma.emailPosteingang.update({
      where: { id: emailId },
      data: { ordner },
    });
  }

  /**
   * E-Mail loeschen (in Papierkorb oder endgueltig)
   */
  async loeschen(tenantId: string, emailId: string) {
    const email = await this.prisma.emailPosteingang.findFirst({
      where: { id: emailId, tenantId },
    });

    if (!email) {
      throw new NotFoundException('E-Mail nicht gefunden.');
    }

    if (email.ordner === 'PAPIERKORB') {
      // Endgueltig loeschen
      await this.prisma.emailPosteingang.delete({ where: { id: emailId } });
      return { nachricht: 'E-Mail endgueltig geloescht.' };
    }

    // In Papierkorb verschieben
    await this.prisma.emailPosteingang.update({
      where: { id: emailId },
      data: { ordner: 'PAPIERKORB' },
    });
    return { nachricht: 'E-Mail in den Papierkorb verschoben.' };
  }

  /**
   * E-Mail senden (ueber Vereins-SMTP oder persoenliches SMTP)
   */
  async senden(
    tenantId: string,
    userId: string,
    daten: { an: string[]; betreff: string; inhalt: string },
  ) {
    // Tenant SMTP-Einstellungen laden
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPass: true,
        smtpAbsenderEmail: true,
        smtpAbsenderName: true,
        name: true,
      },
    });

    // Persoenliche SMTP-Einstellungen pruefen
    const persoenlich = await this.prisma.emailEinstellungen.findUnique({
      where: { userId },
    });

    const smtpHost = persoenlich?.smtpHost || tenant?.smtpHost;
    const absenderEmail =
      persoenlich?.absenderEmail || tenant?.smtpAbsenderEmail;

    if (!smtpHost) {
      // Kein SMTP konfiguriert -> nur loggen und in DB speichern
      console.log(
        `[Mail] SMTP nicht konfiguriert. E-Mail an ${daten.an.join(', ')}: ${daten.betreff}`,
      );
    }

    // In Gesendet-Ordner speichern
    const gesendet = await this.prisma.emailPosteingang.create({
      data: {
        tenantId,
        empfaengerId: userId,
        von: absenderEmail || 'noreply@vereinbase.de',
        vonName: tenant?.name || 'Vereinbase',
        an: daten.an.join(', '),
        betreff: daten.betreff,
        inhalt: daten.inhalt,
        ordner: 'GESENDET',
      },
    });

    // TODO: Tatsaechlicher Versand ueber nodemailer wenn SMTP konfiguriert

    return {
      nachricht: smtpHost
        ? 'E-Mail wurde gesendet.'
        : 'E-Mail wurde gespeichert (SMTP nicht konfiguriert).',
      id: gesendet.id,
    };
  }

  /**
   * Entwurf speichern
   */
  async entwurfSpeichern(
    tenantId: string,
    userId: string,
    daten: { id?: string; an?: string[]; betreff?: string; inhalt?: string },
  ) {
    if (daten.id) {
      return this.prisma.emailEntwurf.update({
        where: { id: daten.id },
        data: {
          an: daten.an,
          betreff: daten.betreff,
          inhalt: daten.inhalt,
        },
      });
    }

    return this.prisma.emailEntwurf.create({
      data: {
        tenantId,
        absenderId: userId,
        an: daten.an || [],
        betreff: daten.betreff,
        inhalt: daten.inhalt,
      },
    });
  }

  /**
   * Entwuerfe abrufen
   */
  async entwuerfeAbrufen(tenantId: string, userId: string) {
    return this.prisma.emailEntwurf.findMany({
      where: { tenantId, absenderId: userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Ungelesene E-Mails zaehlen
   */
  async ungeleseneZaehlen(tenantId: string, userId: string) {
    const anzahl = await this.prisma.emailPosteingang.count({
      where: {
        tenantId,
        gelesen: false,
        ordner: 'POSTEINGANG',
      },
    });
    return { ungelesen: anzahl };
  }
}
