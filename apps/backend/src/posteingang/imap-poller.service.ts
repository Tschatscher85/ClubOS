import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * IMAP-Poller: Holt E-Mails periodisch vom konfigurierten Mailserver.
 * Unterstuetzt sowohl den globalen Vereins-SMTP als auch persoenliche IMAP-Konten.
 */
@Injectable()
export class ImapPollerService implements OnModuleInit {
  private readonly logger = new Logger(ImapPollerService.name);
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    // Polling alle 5 Minuten starten
    const intervallMs = 5 * 60 * 1000;
    this.logger.log(
      `IMAP-Poller gestartet (alle ${intervallMs / 60000} Minuten)`,
    );

    // Erster Abruf nach 30 Sekunden
    setTimeout(() => this.allePostfaecherAbrufen(), 30000);

    this.pollingInterval = setInterval(
      () => this.allePostfaecherAbrufen(),
      intervallMs,
    );
  }

  /**
   * Alle konfigurierten IMAP-Konten abrufen
   */
  async allePostfaecherAbrufen() {
    try {
      // 1. Globale Vereins-SMTP/IMAP Konten
      const tenants = await this.prisma.tenant.findMany({
        where: {
          smtpHost: { not: null },
          smtpUser: { not: null },
        },
        select: {
          id: true,
          smtpHost: true,
          smtpPort: true,
          smtpUser: true,
          smtpPass: true,
          smtpAbsenderEmail: true,
          name: true,
        },
      });

      for (const tenant of tenants) {
        if (!tenant.smtpHost || !tenant.smtpUser) continue;
        await this.postfachAbrufen(
          tenant.id,
          null,
          tenant.smtpHost,
          993, // IMAP Port (SMTP Host oft gleicher Server)
          tenant.smtpUser,
          tenant.smtpPass
            ? Buffer.from(tenant.smtpPass, 'base64').toString()
            : '',
          tenant.smtpAbsenderEmail || tenant.smtpUser,
        );
      }

      // 2. Persoenliche IMAP-Konten (ueber EmailEinstellungen)
      const persoenlich = await this.prisma.emailEinstellungen.findMany({
        where: { istAktiv: true },
        select: {
          userId: true,
          smtpHost: true,
          smtpPort: true,
          smtpUser: true,
          smtpPass: true,
          absenderEmail: true,
          user: { select: { tenantId: true } },
        },
      });

      for (const konto of persoenlich) {
        if (!konto.smtpHost || !konto.smtpUser) continue;
        await this.postfachAbrufen(
          konto.user.tenantId,
          konto.userId,
          konto.smtpHost,
          993,
          konto.smtpUser,
          konto.smtpPass
            ? Buffer.from(konto.smtpPass, 'base64').toString()
            : '',
          konto.absenderEmail,
        );
      }
    } catch (error) {
      this.logger.error('Fehler beim IMAP-Polling:', error);
    }
  }

  /**
   * Einzelnes Postfach per IMAP abrufen
   */
  private async postfachAbrufen(
    tenantId: string,
    userId: string | null,
    host: string,
    port: number,
    user: string,
    pass: string,
    email: string,
  ) {
    let client: InstanceType<typeof import('imapflow').ImapFlow> | null = null;

    try {
      const { ImapFlow } = await import('imapflow');

      client = new ImapFlow({
        host,
        port,
        secure: true,
        auth: { user, pass },
        logger: false,
      });

      await client.connect();
      this.logger.log(`IMAP verbunden: ${email} (${host})`);

      // INBOX oeffnen
      const mailbox = await client.mailboxOpen('INBOX');
      if (!mailbox) {
        this.logger.warn(`Konnte INBOX nicht oeffnen fuer ${email}`);
        return;
      }

      // Nur ungesehene E-Mails holen
      const nachrichten = client.fetch(
        { seen: false },
        {
          envelope: true,
          source: true,
          uid: true,
        },
      );

      let importiert = 0;

      for await (const msg of nachrichten) {
        const envelope = msg.envelope;
        if (!envelope) continue;

        // Pruefen ob diese Nachricht schon importiert wurde
        const messageId = envelope.messageId;
        if (messageId) {
          const existiert = await this.prisma.emailPosteingang.findFirst({
            where: { tenantId, messageId },
          });
          if (existiert) continue;
        }

        // E-Mail in DB speichern
        const vonAdresse = envelope.from?.[0];
        const anAdresse = envelope.to?.[0];

        // E-Mail-Body aus source extrahieren
        let inhalt = '';
        if (msg.source) {
          const bodyStr = msg.source.toString();
          // Einfache Extraktion: alles nach der ersten Leerzeile ist der Body
          const teile = bodyStr.split('\r\n\r\n');
          if (teile.length > 1) {
            inhalt = teile.slice(1).join('\r\n\r\n');
          }
        }

        await this.prisma.emailPosteingang.create({
          data: {
            tenantId,
            empfaengerId: userId,
            von: vonAdresse
              ? `${vonAdresse.name || ''} <${vonAdresse.address || ''}>`
                  .trim()
              : 'unbekannt',
            vonName: vonAdresse?.name || undefined,
            an: anAdresse?.address || email,
            betreff: envelope.subject || '(Kein Betreff)',
            inhalt: inhalt || '(Kein Inhalt)',
            inhaltText: inhalt,
            messageId: messageId || undefined,
            inReplyTo: envelope.inReplyTo || undefined,
            empfangenAm: envelope.date || new Date(),
            ordner: 'POSTEINGANG',
          },
        });

        importiert++;

        // Nachricht als gelesen markieren auf dem Server
        if (msg.uid) {
          try {
            await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen'], {
              uid: true,
            });
          } catch {
            // Ignorieren wenn Flag nicht gesetzt werden kann
          }
        }
      }

      if (importiert > 0) {
        this.logger.log(
          `${importiert} neue E-Mails importiert fuer ${email}`,
        );
      }

      await client.logout();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      // Nur bei unerwarteten Fehlern loggen (nicht bei ECONNREFUSED etc.)
      if (
        !errorMsg.includes('ECONNREFUSED') &&
        !errorMsg.includes('ENOTFOUND') &&
        !errorMsg.includes('ETIMEDOUT')
      ) {
        this.logger.warn(`IMAP-Fehler fuer ${email}: ${errorMsg}`);
      }
    } finally {
      if (client) {
        try {
          await client.logout();
        } catch {
          // Ignorieren
        }
      }
    }
  }
}
