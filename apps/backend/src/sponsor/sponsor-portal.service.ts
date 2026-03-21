import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class SponsorPortalService {
  private readonly logger = new Logger(SponsorPortalService.name);

  constructor(private prisma: PrismaService) {}

  /** Magic Link an Sponsor-Login-E-Mail senden */
  async sendeMagicLink(email: string) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { loginEmail: email },
    });

    if (!sponsor) {
      // Aus Sicherheitsgruenden keine Info ob E-Mail existiert
      return { nachricht: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Login-Link gesendet.' };
    }

    // Token generieren (48 Zeichen, URL-sicher)
    const token = randomBytes(32).toString('hex');
    const tokenGueltigBis = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Stunden

    await this.prisma.sponsor.update({
      where: { id: sponsor.id },
      data: { loginToken: token, tokenGueltigBis },
    });

    // TODO: E-Mail mit Magic Link senden (BullMQ Job)
    // const portalUrl = `${process.env.FRONTEND_URL}/sponsor/${token}`;
    this.logger.log(
      `Magic Link fuer Sponsor "${sponsor.name}" generiert. Token: ${token}`,
    );

    return { nachricht: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Login-Link gesendet.' };
  }

  /** Token validieren und Sponsor-Daten zurueckgeben */
  async tokenValidieren(token: string) {
    const sponsor = await this.prisma.sponsor.findFirst({
      where: {
        loginToken: token,
        tokenGueltigBis: { gte: new Date() },
      },
      include: {
        tenant: {
          select: {
            name: true,
            logo: true,
            primaryColor: true,
            vorstand1Name: true,
            vorstand1Funktion: true,
            email: true,
            telefon: true,
          },
        },
      },
    });

    if (!sponsor) return null;

    return {
      id: sponsor.id,
      name: sponsor.name,
      logoUrl: sponsor.logoUrl,
      webseite: sponsor.webseite,
      beschreibung: sponsor.beschreibung,
      paketName: sponsor.paketName,
      betrag: sponsor.betrag,
      vertragStart: sponsor.vertragStart,
      vertragEnde: sponsor.vertragEnde,
      sichtbarkeit: sponsor.sichtbarkeit,
      verein: sponsor.tenant,
    };
  }

  /** Dashboard-Daten fuer Sponsor abrufen */
  async dashboardDaten(token: string) {
    const sponsor = await this.prisma.sponsor.findFirst({
      where: {
        loginToken: token,
        tokenGueltigBis: { gte: new Date() },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
            vorstand1Name: true,
            vorstand1Funktion: true,
            vorstand2Name: true,
            vorstand2Funktion: true,
            email: true,
            telefon: true,
            anschrift: true,
            plz: true,
            ort: true,
          },
        },
      },
    });

    if (!sponsor) return null;

    // Naechste Events des Vereins abrufen (naechste 5)
    const naechsteEvents = await this.prisma.event.findMany({
      where: {
        tenantId: sponsor.tenantId,
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        location: true,
      },
    });

    // Vereinshomepage-Status pruefen
    const homepage = await this.prisma.homepage.findUnique({
      where: { tenantId: sponsor.tenantId },
      select: {
        istAktiv: true,
        subdomain: true,
        customDomain: true,
      },
    });

    // Sponsoren-Sektion auf Homepage pruefen
    let sponsorSektionAktiv = false;
    if (homepage) {
      const sponsorSektion = await this.prisma.homepageSektion.findFirst({
        where: {
          homepage: { tenantId: sponsor.tenantId },
          typ: 'SPONSOREN',
        },
      });
      sponsorSektionAktiv = !!sponsorSektion;
    }

    return {
      sponsor: {
        id: sponsor.id,
        name: sponsor.name,
        logoUrl: sponsor.logoUrl,
        webseite: sponsor.webseite,
        beschreibung: sponsor.beschreibung,
        paketName: sponsor.paketName,
        betrag: sponsor.betrag,
        vertragStart: sponsor.vertragStart,
        vertragEnde: sponsor.vertragEnde,
        sichtbarkeit: sponsor.sichtbarkeit,
        istAktiv: sponsor.istAktiv,
      },
      verein: sponsor.tenant,
      naechsteEvents,
      homepage: homepage
        ? {
            istAktiv: homepage.istAktiv,
            sponsorSektionAktiv,
            url: homepage.customDomain
              ? `https://${homepage.customDomain}`
              : homepage.subdomain
                ? `https://${homepage.subdomain}.vereinbase.de`
                : null,
          }
        : null,
      kontakt: {
        vorstand1: sponsor.tenant.vorstand1Name
          ? {
              name: sponsor.tenant.vorstand1Name,
              funktion: sponsor.tenant.vorstand1Funktion || '1. Vorsitzender',
            }
          : null,
        vorstand2: sponsor.tenant.vorstand2Name
          ? {
              name: sponsor.tenant.vorstand2Name,
              funktion: sponsor.tenant.vorstand2Funktion || '2. Vorsitzender',
            }
          : null,
        email: sponsor.tenant.email,
        telefon: sponsor.tenant.telefon,
        adresse: [sponsor.tenant.anschrift, `${sponsor.tenant.plz || ''} ${sponsor.tenant.ort || ''}`]
          .filter(Boolean)
          .join(', '),
      },
    };
  }
}
