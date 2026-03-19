import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private istKonfiguriert = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
      webpush.setVapidDetails(
        'mailto:' + (process.env.VAPID_EMAIL || 'admin@vereinbase.de'),
        publicKey,
        privateKey,
      );
      this.istKonfiguriert = true;
      this.logger.log('VAPID-Schluessel konfiguriert. Web-Push ist aktiv.');
    } else {
      this.logger.warn(
        'VAPID-Schluessel nicht gesetzt. Web-Push ist deaktiviert. ' +
        'Setzen Sie VAPID_PUBLIC_KEY und VAPID_PRIVATE_KEY in der .env-Datei.',
      );
    }
  }

  /**
   * Push-Subscription eines Benutzers speichern
   */
  async abonnieren(userId: string, endpoint: string, p256dh: string, auth: string) {
    // Upsert: Falls der Endpoint bereits existiert, aktualisieren
    const subscription = await this.prisma.webPushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh, auth },
      create: { userId, endpoint, p256dh, auth },
    });

    this.logger.log(`Web-Push-Abonnement gespeichert fuer Benutzer ${userId}`);
    return subscription;
  }

  /**
   * Push-Subscription entfernen
   */
  async abmelden(userId: string, endpoint: string) {
    const geloescht = await this.prisma.webPushSubscription.deleteMany({
      where: { userId, endpoint },
    });

    this.logger.log(
      `Web-Push-Abonnement entfernt fuer Benutzer ${userId}: ${geloescht.count} Eintraege`,
    );

    return { geloescht: geloescht.count };
  }

  /**
   * Push-Nachricht an einen bestimmten Benutzer senden
   */
  async sendePush(
    userId: string,
    payload: { title: string; body: string; url?: string },
  ) {
    if (!this.istKonfiguriert) {
      this.logger.warn('Web-Push nicht konfiguriert. Nachricht wird nicht gesendet.');
      return;
    }

    const subscriptions = await this.prisma.webPushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      this.logger.debug(`Keine Push-Subscriptions fuer Benutzer ${userId}`);
      return;
    }

    const ergebnisse = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
          );
        } catch (fehler: unknown) {
          const statusCode = (fehler as { statusCode?: number }).statusCode;
          // 410 Gone = Subscription abgelaufen
          if (statusCode === 410 || statusCode === 404) {
            this.logger.log(
              `Abgelaufene Subscription entfernt: ${sub.endpoint.substring(0, 50)}...`,
            );
            await this.prisma.webPushSubscription.delete({
              where: { id: sub.id },
            });
          } else {
            this.logger.error(
              `Push-Fehler fuer ${sub.endpoint.substring(0, 50)}...: ${statusCode}`,
            );
          }
          throw fehler;
        }
      }),
    );

    const erfolgreich = ergebnisse.filter((r) => r.status === 'fulfilled').length;
    const fehlgeschlagen = ergebnisse.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Push an Benutzer ${userId}: ${erfolgreich} erfolgreich, ${fehlgeschlagen} fehlgeschlagen`,
    );
  }

  /**
   * Push-Nachricht an mehrere Benutzer senden
   */
  async sendePushAnMehrere(
    userIds: string[],
    payload: { title: string; body: string; url?: string },
  ) {
    await Promise.allSettled(
      userIds.map((userId) => this.sendePush(userId, payload)),
    );
  }
}
