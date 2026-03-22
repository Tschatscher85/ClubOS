import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Plan } from '@prisma/client';
import { AuditService } from './audit.service';

interface AuditKontext {
  userId: string;
  userEmail: string;
  ipAdresse?: string;
}

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private audit: AuditService,
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
  async vereinSperren(id: string, grund: string, kontext: AuditKontext) {
    const verein = await this.prisma.tenant.findUnique({ where: { id } });
    if (!verein) throw new NotFoundException('Verein nicht gefunden');

    const ergebnis = await this.prisma.tenant.update({
      where: { id },
      data: {
        istAktiv: false,
        gesperrtAm: new Date(),
        gesperrtGrund: grund,
      },
      select: { id: true, name: true, istAktiv: true, gesperrtAm: true, gesperrtGrund: true },
    });

    await this.audit.loggen({
      aktion: 'VEREIN_GESPERRT',
      userId: kontext.userId,
      userEmail: kontext.userEmail,
      tenantId: id,
      tenantName: verein.name,
      details: JSON.stringify({ grund }),
      ipAdresse: kontext.ipAdresse,
    });

    return ergebnis;
  }

  /** Verein entsperren */
  async vereinEntsperren(id: string, kontext: AuditKontext) {
    const verein = await this.prisma.tenant.findUnique({ where: { id } });
    if (!verein) throw new NotFoundException('Verein nicht gefunden');

    const ergebnis = await this.prisma.tenant.update({
      where: { id },
      data: {
        istAktiv: true,
        gesperrtAm: null,
        gesperrtGrund: null,
      },
      select: { id: true, name: true, istAktiv: true },
    });

    await this.audit.loggen({
      aktion: 'VEREIN_ENTSPERRT',
      userId: kontext.userId,
      userEmail: kontext.userEmail,
      tenantId: id,
      tenantName: verein.name,
      ipAdresse: kontext.ipAdresse,
    });

    return ergebnis;
  }

  /** Plan aendern */
  async planAendern(id: string, plan: Plan, kontext: AuditKontext) {
    const verein = await this.prisma.tenant.findUnique({ where: { id } });
    if (!verein) throw new NotFoundException('Verein nicht gefunden');

    const alterPlan = verein.plan;

    const ergebnis = await this.prisma.tenant.update({
      where: { id },
      data: { plan },
      select: { id: true, name: true, plan: true },
    });

    await this.audit.loggen({
      aktion: 'PLAN_GEAENDERT',
      userId: kontext.userId,
      userEmail: kontext.userEmail,
      tenantId: id,
      tenantName: verein.name,
      details: JSON.stringify({ vonPlan: alterPlan, zuPlan: plan }),
      ipAdresse: kontext.ipAdresse,
    });

    return ergebnis;
  }

  /** Als Verein einloggen (Impersonation) */
  async impersonate(tenantId: string, kontext: AuditKontext) {
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

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, logo: true, primaryColor: true },
    });

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

    await this.audit.loggen({
      aktion: 'IMPERSONATION',
      userId: kontext.userId,
      userEmail: kontext.userEmail,
      tenantId,
      tenantName: tenant?.name,
      details: JSON.stringify({ alsUser: adminUser.email }),
      ipAdresse: kontext.ipAdresse,
    });

    return {
      accessToken,
      benutzer: {
        id: adminUser.id,
        email: adminUser.email,
        rolle: adminUser.role,
      },
      tenant,
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

  // ==================== Plattform KI-Einstellungen ====================

  /** Plattform KI-Konfiguration laden (Keys maskiert) */
  async plattformKiLaden() {
    const config = await this.prisma.plattformConfig.findUnique({
      where: { id: 'singleton' },
    });
    if (!config) {
      return { anthropicApiKey: null, openaiApiKey: null, standardProvider: 'anthropic', standardModell: null };
    }
    return {
      anthropicApiKey: config.anthropicApiKey ? `****${config.anthropicApiKey.slice(-4)}` : null,
      openaiApiKey: config.openaiApiKey ? `****${config.openaiApiKey.slice(-4)}` : null,
      standardProvider: config.standardProvider,
      standardModell: config.standardModell,
      hatAnthropicKey: !!config.anthropicApiKey,
      hatOpenaiKey: !!config.openaiApiKey,
    };
  }

  /** Plattform KI-Konfiguration speichern */
  async plattformKiSpeichern(
    daten: {
      anthropicApiKey?: string;
      openaiApiKey?: string;
      standardProvider?: string;
      standardModell?: string;
    },
    kontext: AuditKontext,
  ) {
    const updateData: Record<string, unknown> = {};

    // Nur aktualisieren wenn nicht maskiert (****)
    if (daten.anthropicApiKey !== undefined && !daten.anthropicApiKey.startsWith('****')) {
      updateData.anthropicApiKey = daten.anthropicApiKey || null;
    }
    if (daten.openaiApiKey !== undefined && !daten.openaiApiKey.startsWith('****')) {
      updateData.openaiApiKey = daten.openaiApiKey || null;
    }
    if (daten.standardProvider) {
      updateData.standardProvider = daten.standardProvider;
    }
    if (daten.standardModell !== undefined) {
      updateData.standardModell = daten.standardModell || null;
    }

    const ergebnis = await this.prisma.plattformConfig.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: {
        id: 'singleton',
        ...updateData,
        standardProvider: (updateData.standardProvider as string) || 'anthropic',
      },
    });

    await this.audit.loggen({
      aktion: 'KI_EINSTELLUNGEN',
      userId: kontext.userId,
      userEmail: kontext.userEmail,
      details: JSON.stringify({ provider: daten.standardProvider }),
      ipAdresse: kontext.ipAdresse,
    });

    return ergebnis;
  }

  /** Plattform E-Mail-Konfiguration laden (Passwort maskiert) */
  async plattformEmailLaden() {
    const config = await this.prisma.plattformConfig.findUnique({
      where: { id: 'singleton' },
    });
    if (!config) {
      return {
        smtpHost: null, smtpPort: 587, smtpUser: null, smtpPass: null,
        smtpFrom: null, smtpFromName: null,
        imapHost: null, imapPort: 993, imapUser: null, imapPass: null,
      };
    }
    return {
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort || 587,
      smtpUser: config.smtpUser,
      smtpPass: config.smtpPass ? '****' : null,
      smtpFrom: config.smtpFrom,
      smtpFromName: config.smtpFromName,
      imapHost: config.imapHost,
      imapPort: config.imapPort || 993,
      imapUser: config.imapUser,
      imapPass: config.imapPass ? '****' : null,
      hatSmtp: !!(config.smtpHost && config.smtpUser),
      hatImap: !!(config.imapHost && config.imapUser),
    };
  }

  /** Plattform E-Mail-Konfiguration speichern */
  async plattformEmailSpeichern(
    daten: {
      smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPass?: string;
      smtpFrom?: string; smtpFromName?: string;
      imapHost?: string; imapPort?: number; imapUser?: string; imapPass?: string;
    },
    kontext: AuditKontext,
  ) {
    const updateData: Record<string, unknown> = {};
    if (daten.smtpHost !== undefined) updateData.smtpHost = daten.smtpHost || null;
    if (daten.smtpPort !== undefined) updateData.smtpPort = daten.smtpPort || 587;
    if (daten.smtpUser !== undefined) updateData.smtpUser = daten.smtpUser || null;
    if (daten.smtpPass !== undefined && daten.smtpPass !== '****') updateData.smtpPass = daten.smtpPass || null;
    if (daten.smtpFrom !== undefined) updateData.smtpFrom = daten.smtpFrom || null;
    if (daten.smtpFromName !== undefined) updateData.smtpFromName = daten.smtpFromName || null;
    if (daten.imapHost !== undefined) updateData.imapHost = daten.imapHost || null;
    if (daten.imapPort !== undefined) updateData.imapPort = daten.imapPort || 993;
    if (daten.imapUser !== undefined) updateData.imapUser = daten.imapUser || null;
    if (daten.imapPass !== undefined && daten.imapPass !== '****') updateData.imapPass = daten.imapPass || null;

    const ergebnis = await this.prisma.plattformConfig.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: { id: 'singleton', standardProvider: 'anthropic', ...updateData },
    });

    await this.audit.loggen({
      aktion: 'EMAIL_EINSTELLUNGEN',
      userId: kontext.userId,
      userEmail: kontext.userEmail,
      details: `SMTP: ${daten.smtpHost || 'nicht gesetzt'}, From: ${daten.smtpFrom || '-'}`,
      ipAdresse: kontext.ipAdresse,
    });

    return { nachricht: 'E-Mail-Einstellungen gespeichert.' };
  }

  /** Test-Mail senden */
  async testMailSenden(empfaenger: string, absenderEmail: string) {
    const config = await this.prisma.plattformConfig.findUnique({
      where: { id: 'singleton' },
    });

    if (!config?.smtpHost || !config?.smtpUser || !config?.smtpPass) {
      return { erfolg: false, fehler: 'SMTP nicht konfiguriert. Bitte zuerst SMTP-Einstellungen speichern.' };
    }

    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort || 587,
        secure: (config.smtpPort || 587) === 465,
        auth: { user: config.smtpUser, pass: config.smtpPass },
      });

      await transporter.sendMail({
        from: `${config.smtpFromName || 'Vereinbase'} <${config.smtpFrom || config.smtpUser}>`,
        to: empfaenger,
        subject: 'Vereinbase — Test-Mail',
        html: `<h2>E-Mail-Versand funktioniert!</h2>
          <p>Diese Test-Mail wurde aus dem Vereinbase Admin-Dashboard gesendet.</p>
          <p><strong>Absender:</strong> ${config.smtpFromName || 'Vereinbase'} &lt;${config.smtpFrom || config.smtpUser}&gt;</p>
          <p><strong>SMTP-Server:</strong> ${config.smtpHost}:${config.smtpPort}</p>
          <p style="color:#888;font-size:12px">Zeitpunkt: ${new Date().toLocaleString('de-DE')}</p>`,
      });

      return { erfolg: true, nachricht: `Test-Mail an ${empfaenger} gesendet.` };
    } catch (error) {
      return { erfolg: false, fehler: `SMTP-Fehler: ${error instanceof Error ? error.message : 'Unbekannt'}` };
    }
  }

  /** KI pro Verein freischalten / sperren + Provider waehlen */
  async kiToggle(id: string, freigeschaltet: boolean, provider: string | undefined, kontext: AuditKontext) {
    const verein = await this.prisma.tenant.findUnique({ where: { id } });
    if (!verein) throw new NotFoundException('Verein nicht gefunden');

    const data: Record<string, unknown> = { kiFreigeschaltet: freigeschaltet };
    if (provider) data.kiProvider = provider;

    const ergebnis = await this.prisma.tenant.update({
      where: { id },
      data,
      select: { id: true, name: true, kiFreigeschaltet: true, kiProvider: true },
    });

    await this.audit.loggen({
      aktion: 'KI_TOGGLE',
      userId: kontext.userId,
      userEmail: kontext.userEmail,
      tenantId: id,
      tenantName: verein.name,
      details: JSON.stringify({ freigeschaltet, provider }),
      ipAdresse: kontext.ipAdresse,
    });

    return ergebnis;
  }

  // ==================== System-Status ====================

  /** System-Status abrufen */
  async systemStatus() {
    const ergebnis: Record<string, unknown> = {};

    // PostgreSQL
    try {
      const dbSize = await this.prisma.$queryRaw<[{ pg_database_size: bigint }]>`
        SELECT pg_database_size(current_database())
      `;
      ergebnis.postgresql = {
        status: 'ok',
        groesse: Number(dbSize[0].pg_database_size),
        groesseFormatiert: this.formatBytes(Number(dbSize[0].pg_database_size)),
      };
    } catch (err) {
      ergebnis.postgresql = {
        status: 'fehler',
        fehler: err instanceof Error ? err.message : 'Unbekannter Fehler',
      };
    }

    // Redis
    try {
      const redisUrl = this.config.get<string>('redis.url') || 'redis://localhost:6379';
      const url = new URL(redisUrl);
      const net = await import('net');
      const redisOk = await new Promise<boolean>((resolve) => {
        const socket = net.createConnection(
          { host: url.hostname, port: parseInt(url.port, 10) || 6379, timeout: 2000 },
          () => { socket.destroy(); resolve(true); },
        );
        socket.on('error', () => { socket.destroy(); resolve(false); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
      });
      ergebnis.redis = { status: redisOk ? 'ok' : 'fehler' };
    } catch {
      ergebnis.redis = { status: 'fehler' };
    }

    // Queues - BullMQ Statistiken
    try {
      const queueNames = ['email', 'erinnerung', 'benachrichtigung', 'geburtstag', 'warteliste'];
      const Bull = await import('bull');
      const redisUrl = this.config.get<string>('redis.url') || 'redis://localhost:6379';
      const redisUrlObj = new URL(redisUrl);
      const redisOpts = {
        host: redisUrlObj.hostname,
        port: parseInt(redisUrlObj.port, 10) || 6379,
        password: redisUrlObj.password || undefined,
      };

      const queues: Record<string, unknown>[] = [];
      for (const name of queueNames) {
        try {
          const queue = new Bull.default(name, { redis: redisOpts });
          const counts = await queue.getJobCounts();
          queues.push({ name, ...counts });
          await queue.close();
        } catch {
          queues.push({ name, status: 'fehler' });
        }
      }
      ergebnis.queues = queues;
    } catch {
      ergebnis.queues = [];
    }

    // Server
    const mem = process.memoryUsage();
    ergebnis.server = {
      uptime: process.uptime(),
      uptimeFormatiert: this.formatUptime(process.uptime()),
      speicher: {
        rss: this.formatBytes(mem.rss),
        heapUsed: this.formatBytes(mem.heapUsed),
        heapTotal: this.formatBytes(mem.heapTotal),
        rssBytes: mem.rss,
        heapUsedBytes: mem.heapUsed,
        heapTotalBytes: mem.heapTotal,
      },
      nodeVersion: process.version,
    };

    // Statistiken
    try {
      const [tenants, users, events, members] = await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.user.count(),
        this.prisma.event.count(),
        this.prisma.member.count(),
      ]);
      ergebnis.statistiken = { tenants, users, events, members };
    } catch {
      ergebnis.statistiken = { tenants: 0, users: 0, events: 0, members: 0 };
    }

    return ergebnis;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const einheiten = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${einheiten[i]}`;
  }

  private formatUptime(sekunden: number): string {
    const tage = Math.floor(sekunden / 86400);
    const stunden = Math.floor((sekunden % 86400) / 3600);
    const minuten = Math.floor((sekunden % 3600) / 60);
    const teile: string[] = [];
    if (tage > 0) teile.push(`${tage}d`);
    if (stunden > 0) teile.push(`${stunden}h`);
    teile.push(`${minuten}m`);
    return teile.join(' ');
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
