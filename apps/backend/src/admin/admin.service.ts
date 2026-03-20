import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Plan } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  /** Alle Vereine mit Statistiken abrufen */
  async alleVereine() {
    const vereine = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        plan: true,
        istAktiv: true,
        kiFreigeschaltet: true,
        gesperrtAm: true,
        gesperrtGrund: true,
        stripeSubscriptionId: true,
        trialEndsAt: true,
        createdAt: true,
        email: true,
        ort: true,
        _count: {
          select: {
            users: true,
            members: true,
            teams: true,
            events: true,
          },
        },
      },
    });

    return vereine.map((v) => ({
      ...v,
      mitgliederAnzahl: v._count.members,
      benutzerAnzahl: v._count.users,
      teamsAnzahl: v._count.teams,
      eventsAnzahl: v._count.events,
      _count: undefined,
      status: this.berechneStatus(v),
    }));
  }

  /** Einzelnen Verein mit Details abrufen */
  async vereinDetail(id: string) {
    const verein = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            members: true,
            teams: true,
            events: true,
            tournaments: true,
            messages: true,
            dokumente: true,
          },
        },
      },
    });

    if (!verein) {
      throw new NotFoundException('Verein nicht gefunden');
    }

    return {
      ...verein,
      // Sensible Felder maskieren
      kiApiKey: verein.kiApiKey ? '***' : null,
      smtpPass: verein.smtpPass ? '***' : null,
      status: this.berechneStatus(verein),
    };
  }

  /** Verein sperren */
  async vereinSperren(id: string, grund: string) {
    const verein = await this.prisma.tenant.findUnique({ where: { id } });
    if (!verein) throw new NotFoundException('Verein nicht gefunden');

    return this.prisma.tenant.update({
      where: { id },
      data: {
        istAktiv: false,
        gesperrtAm: new Date(),
        gesperrtGrund: grund,
      },
      select: { id: true, name: true, istAktiv: true, gesperrtAm: true, gesperrtGrund: true },
    });
  }

  /** Verein entsperren */
  async vereinEntsperren(id: string) {
    const verein = await this.prisma.tenant.findUnique({ where: { id } });
    if (!verein) throw new NotFoundException('Verein nicht gefunden');

    return this.prisma.tenant.update({
      where: { id },
      data: {
        istAktiv: true,
        gesperrtAm: null,
        gesperrtGrund: null,
      },
      select: { id: true, name: true, istAktiv: true },
    });
  }

  /** Plan aendern */
  async planAendern(id: string, plan: Plan) {
    const verein = await this.prisma.tenant.findUnique({ where: { id } });
    if (!verein) throw new NotFoundException('Verein nicht gefunden');

    return this.prisma.tenant.update({
      where: { id },
      data: { plan },
      select: { id: true, name: true, plan: true },
    });
  }

  /** Als Verein einloggen (Impersonation) */
  async impersonate(tenantId: string) {
    // Finde den Admin-User des Vereins
    const adminUser = await this.prisma.user.findFirst({
      where: {
        tenantId,
        role: 'ADMIN',
      },
      select: { id: true, email: true, role: true, tenantId: true },
    });

    if (!adminUser) {
      throw new NotFoundException(
        'Kein Admin-Benutzer fuer diesen Verein gefunden',
      );
    }

    // Token generieren mit dem Admin-User des Vereins
    const payload = {
      sub: adminUser.id,
      email: adminUser.email,
      rolle: adminUser.role,
      tenantId: adminUser.tenantId,
      impersonated: true, // Markierung dass es Impersonation ist
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: '1h',
    });

    return {
      accessToken,
      benutzer: {
        id: adminUser.id,
        email: adminUser.email,
        rolle: adminUser.role,
      },
      tenant: await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, slug: true, logo: true, primaryColor: true },
      }),
    };
  }

  /** Plattform-Statistiken */
  async plattformStatistiken() {
    const [
      vereineGesamt,
      vereineAktiv,
      vereineGesperrt,
      mitgliederGesamt,
      benutzerGesamt,
      teamsGesamt,
      eventsGesamt,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { istAktiv: true } }),
      this.prisma.tenant.count({ where: { istAktiv: false } }),
      this.prisma.member.count(),
      this.prisma.user.count(),
      this.prisma.team.count(),
      this.prisma.event.count(),
    ]);

    const planVerteilung = await this.prisma.tenant.groupBy({
      by: ['plan'],
      _count: true,
    });

    return {
      vereineGesamt,
      vereineAktiv,
      vereineGesperrt,
      mitgliederGesamt,
      benutzerGesamt,
      teamsGesamt,
      eventsGesamt,
      planVerteilung: planVerteilung.map((p) => ({
        plan: p.plan,
        anzahl: p._count,
      })),
    };
  }

  /** Daten-Export fuer einen Verein (DSGVO / Backup) */
  async vereinExport(id: string) {
    const verein = await this.prisma.tenant.findUnique({ where: { id } });
    if (!verein) throw new NotFoundException('Verein nicht gefunden');

    const [members, teams, events, users] = await Promise.all([
      this.prisma.member.findMany({ where: { tenantId: id } }),
      this.prisma.team.findMany({ where: { tenantId: id } }),
      this.prisma.event.findMany({ where: { tenantId: id } }),
      this.prisma.user.findMany({
        where: { tenantId: id },
        select: { id: true, email: true, role: true, createdAt: true },
      }),
    ]);

    return {
      verein,
      mitglieder: members,
      teams,
      veranstaltungen: events,
      benutzer: users,
      exportiertAm: new Date().toISOString(),
    };
  }

  /** KI pro Verein freischalten / sperren */
  async kiToggle(id: string, freigeschaltet: boolean) {
    const verein = await this.prisma.tenant.findUnique({ where: { id } });
    if (!verein) throw new NotFoundException('Verein nicht gefunden');

    return this.prisma.tenant.update({
      where: { id },
      data: { kiFreigeschaltet: freigeschaltet },
      select: { id: true, name: true, kiFreigeschaltet: true },
    });
  }

  private berechneStatus(verein: {
    istAktiv: boolean;
    trialEndsAt?: Date | null;
    stripeSubscriptionId?: string | null;
  }): 'aktiv' | 'trial' | 'gesperrt' | 'ueberfaellig' {
    if (!verein.istAktiv) return 'gesperrt';

    if (verein.trialEndsAt) {
      const jetzt = new Date();
      if (verein.trialEndsAt > jetzt && !verein.stripeSubscriptionId) {
        return 'trial';
      }
      if (verein.trialEndsAt <= jetzt && !verein.stripeSubscriptionId) {
        return 'ueberfaellig';
      }
    }

    return 'aktiv';
  }
}
