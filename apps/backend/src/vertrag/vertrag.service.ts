import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class VertragService {
  private readonly logger = new Logger(VertragService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get<number>('SMTP_PORT') || 587,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  /** Neuen Vertrag erstellen */
  async erstellen(daten: { titel: string; inhalt: string; erstelltVon: string }) {
    return this.prisma.vertrag.create({
      data: {
        titel: daten.titel,
        inhalt: daten.inhalt,
        erstelltVon: daten.erstelltVon,
      },
    });
  }

  /** Alle Vertraege mit Unterschriften-Statistik abrufen */
  async alleAbrufen() {
    const vertraege = await this.prisma.vertrag.findMany({
      include: {
        einladungen: {
          select: {
            id: true,
            unterschriebenAm: true,
          },
        },
      },
      orderBy: { erstelltAm: 'desc' },
    });

    return vertraege.map((v) => ({
      id: v.id,
      titel: v.titel,
      version: v.version,
      erstelltAm: v.erstelltAm,
      updatedAt: v.updatedAt,
      einladungenGesamt: v.einladungen.length,
      unterschriebenAnzahl: v.einladungen.filter((e) => e.unterschriebenAm !== null).length,
    }));
  }

  /** Vertrag mit allen Einladungen abrufen */
  async detailAbrufen(id: string) {
    const vertrag = await this.prisma.vertrag.findUnique({
      where: { id },
      include: {
        einladungen: {
          orderBy: { erstelltAm: 'desc' },
        },
      },
    });

    if (!vertrag) {
      throw new NotFoundException('Vertrag nicht gefunden');
    }

    return vertrag;
  }

  /** Vertrag aktualisieren */
  async aktualisieren(id: string, daten: { titel?: string; inhalt?: string }) {
    const vertrag = await this.prisma.vertrag.findUnique({ where: { id } });
    if (!vertrag) {
      throw new NotFoundException('Vertrag nicht gefunden');
    }

    return this.prisma.vertrag.update({
      where: { id },
      data: {
        ...(daten.titel !== undefined && { titel: daten.titel }),
        ...(daten.inhalt !== undefined && { inhalt: daten.inhalt }),
        version: { increment: 1 },
      },
    });
  }

  /** Vertrag loeschen */
  async loeschen(id: string) {
    const vertrag = await this.prisma.vertrag.findUnique({ where: { id } });
    if (!vertrag) {
      throw new NotFoundException('Vertrag nicht gefunden');
    }

    await this.prisma.vertrag.delete({ where: { id } });
    return { erfolg: true };
  }

  /** Person zur Unterschrift einladen */
  async einladen(vertragId: string, email: string, name: string) {
    const vertrag = await this.prisma.vertrag.findUnique({ where: { id: vertragId } });
    if (!vertrag) {
      throw new NotFoundException('Vertrag nicht gefunden');
    }

    // Pruefen ob diese E-Mail bereits eingeladen wurde
    const bestehend = await this.prisma.vertragEinladung.findFirst({
      where: { vertragId, email },
    });
    if (bestehend) {
      throw new BadRequestException('Diese E-Mail wurde bereits fuer diesen Vertrag eingeladen');
    }

    const token = randomBytes(32).toString('hex');

    const einladung = await this.prisma.vertragEinladung.create({
      data: {
        vertragId,
        email,
        name,
        token,
      },
    });

    // E-Mail senden
    await this.einladungsEmailSenden(email, name, vertrag.titel, token);

    return einladung;
  }

  /** Einladung entfernen */
  async einladungEntfernen(einladungId: string) {
    const einladung = await this.prisma.vertragEinladung.findUnique({
      where: { id: einladungId },
    });
    if (!einladung) {
      throw new NotFoundException('Einladung nicht gefunden');
    }

    await this.prisma.vertragEinladung.delete({ where: { id: einladungId } });
    return { erfolg: true };
  }

  /** Vertrag per Token laden (oeffentlich) */
  async vertragLaden(token: string) {
    const einladung = await this.prisma.vertragEinladung.findUnique({
      where: { token },
      include: {
        vertrag: {
          select: {
            id: true,
            titel: true,
            inhalt: true,
            version: true,
          },
        },
      },
    });

    if (!einladung) {
      throw new NotFoundException('Ungültiger oder abgelaufener Link');
    }

    return {
      vertrag: einladung.vertrag,
      name: einladung.name,
      email: einladung.email,
      bereitsUnterschrieben: einladung.unterschriebenAm !== null,
      unterschriebenAm: einladung.unterschriebenAm,
    };
  }

  /** Vertrag unterschreiben (oeffentlich) */
  async unterschreiben(token: string, unterschrift: string, ip: string) {
    const einladung = await this.prisma.vertragEinladung.findUnique({
      where: { token },
    });

    if (!einladung) {
      throw new NotFoundException('Ungültiger oder abgelaufener Link');
    }

    if (einladung.unterschriebenAm) {
      throw new BadRequestException('Dieser Vertrag wurde bereits unterschrieben');
    }

    if (!unterschrift || unterschrift.trim().length < 2) {
      throw new BadRequestException('Bitte geben Sie Ihre vollstaendige Unterschrift ein');
    }

    return this.prisma.vertragEinladung.update({
      where: { id: einladung.id },
      data: {
        unterschriebenAm: new Date(),
        unterschriftDaten: unterschrift.trim(),
        ipAdresse: ip,
      },
    });
  }

  /** Einladungs-E-Mail senden */
  private async einladungsEmailSenden(
    email: string,
    name: string,
    vertragTitel: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://vereinbase.de';
    const link = `${frontendUrl}/vertrag/${token}`;

    const absenderEmail =
      this.configService.get<string>('SMTP_FROM') || 'noreply@vereinbase.de';

    const htmlInhalt = `<h2>Hallo ${name},</h2>
      <p>Sie wurden gebeten, folgenden Vertrag zu lesen und zu unterschreiben:</p>
      <p><strong>${vertragTitel}</strong></p>
      <p>Bitte klicken Sie auf den folgenden Link, um den Vertrag einzusehen und digital zu unterschreiben:</p>
      <p><a href="${link}" style="background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Vertrag ansehen & unterschreiben</a></p>
      <p>Oder kopieren Sie diesen Link: ${link}</p>
      <p>Mit freundlichen Gruessen,<br>Vereinbase</p>`;

    if (!this.transporter) {
      this.logger.log(`[Mail] SMTP nicht konfiguriert. Vertrags-Einladung an ${email}: ${link}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"Vereinbase" <${absenderEmail}>`,
        to: email,
        subject: `Vertrag zur Unterschrift: ${vertragTitel}`,
        html: htmlInhalt,
      });
      this.logger.log(`Vertrags-Einladung erfolgreich an ${email} gesendet`);
    } catch (fehler) {
      this.logger.error(`Fehler beim Senden der Vertrags-Einladung an ${email}: ${fehler}`);
    }
  }
}
