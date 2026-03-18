import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generiert einen Empfehlungscode aus dem Slug des Vereins + 4 Zufallsziffern.
   * Beispiel: "FCKUNCHEN2026"
   */
  private async codeGenerieren(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    });

    if (!tenant) {
      throw new NotFoundException('Verein nicht gefunden.');
    }

    const basis = tenant.slug.toUpperCase().replace(/-/g, '');
    const zufallsZiffern = Math.floor(1000 + Math.random() * 9000).toString();
    const code = `${basis}${zufallsZiffern}`;

    // Sicherstellen, dass der Code einzigartig ist
    const vorhanden = await this.prisma.referral.findUnique({
      where: { code },
    });

    if (vorhanden) {
      // Bei Kollision erneut versuchen
      return this.codeGenerieren(tenantId);
    }

    return code;
  }

  /**
   * Erstellt oder gibt den bestehenden Empfehlungscode fuer einen Verein zurueck.
   */
  async meinCodeAbrufen(tenantId: string) {
    let referral = await this.prisma.referral.findUnique({
      where: { referrerId: tenantId },
    });

    if (!referral) {
      const code = await this.codeGenerieren(tenantId);
      referral = await this.prisma.referral.create({
        data: {
          referrerId: tenantId,
          code,
        },
      });
    }

    return {
      code: referral.code,
      empfohleneVereine: referral.genutzteVon.length,
      freiMonate: referral.freiMonate,
      erstelltAm: referral.erstelltAm,
      ausgezahltAm: referral.ausgezahltAm,
    };
  }

  /**
   * Loest einen Empfehlungscode ein.
   * Wird waehrend der Registrierung aufgerufen (ohne Auth).
   */
  async einloesen(code: string, neuerTenantId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!referral) {
      throw new NotFoundException(
        'Ungueltiger Empfehlungscode. Bitte pruefen Sie den Code und versuchen Sie es erneut.',
      );
    }

    // Pruefen ob der Verein sich nicht selbst empfiehlt
    if (referral.referrerId === neuerTenantId) {
      throw new BadRequestException(
        'Sie koennen Ihren eigenen Empfehlungscode nicht einloesen.',
      );
    }

    // Pruefen ob der Verein den Code bereits eingeloest hat
    if (referral.genutzteVon.includes(neuerTenantId)) {
      throw new BadRequestException(
        'Dieser Empfehlungscode wurde bereits fuer Ihren Verein eingeloest.',
      );
    }

    // Code einloesen: genutzteVon erweitern + freiMonate erhoehen
    await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        genutzteVon: { push: neuerTenantId },
        freiMonate: { increment: 1 },
      },
    });

    return {
      nachricht:
        'Empfehlungscode erfolgreich eingeloest! Beide Vereine erhalten 1 Gratismonat.',
      referrerId: referral.referrerId,
    };
  }

  /**
   * Detaillierte Statistik fuer den Admin.
   */
  async statistikAbrufen(tenantId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { referrerId: tenantId },
    });

    if (!referral) {
      return {
        code: null,
        empfohleneVereine: 0,
        freiMonate: 0,
        erstelltAm: null,
        ausgezahltAm: null,
        empfehlungen: [],
      };
    }

    return {
      code: referral.code,
      empfohleneVereine: referral.genutzteVon.length,
      freiMonate: referral.freiMonate,
      erstelltAm: referral.erstelltAm,
      ausgezahltAm: referral.ausgezahltAm,
      // Aus Datenschutzgruenden keine Namen, nur Anzahl
      empfehlungen: referral.genutzteVon.map((_, index) => ({
        nr: index + 1,
      })),
    };
  }
}
