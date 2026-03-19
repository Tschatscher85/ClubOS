import { Injectable, Logger, BadRequestException, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';

// Tarif-Preise (Stripe Price-IDs aus den Umgebungsvariablen)
const PLAN_PREISE: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_PRICE_STARTER,
  PRO: process.env.STRIPE_PRICE_PRO,
  CLUB: process.env.STRIPE_PRICE_CLUB,
};

// Tarif-Beschreibungen
const PLAN_DETAILS: Record<string, { name: string; preis: string }> = {
  STARTER: { name: 'Starter', preis: '29 EUR/Monat' },
  PRO: { name: 'Pro', preis: '79 EUR/Monat' },
  CLUB: { name: 'Club', preis: '149 EUR/Monat' },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    @Optional() @InjectQueue('email') private readonly emailQueue?: Queue,
  ) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion,
      });
      this.logger.log('Stripe initialisiert (Testmodus: ' + secretKey.startsWith('sk_test_') + ')');
    } else {
      this.logger.warn(
        'STRIPE_SECRET_KEY nicht gesetzt. Billing ist deaktiviert.',
      );
    }
  }

  private stripeAktiv(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException(
        'Stripe ist nicht konfiguriert. Bitte kontaktieren Sie den Support.',
      );
    }
    return this.stripe;
  }

  /**
   * Stripe Checkout-Session erstellen
   */
  async erstelleCheckoutSession(tenantId: string, plan: 'STARTER' | 'PRO' | 'CLUB') {
    const stripe = this.stripeAktiv();

    const priceId = PLAN_PREISE[plan];
    if (!priceId) {
      throw new BadRequestException(
        `Kein Stripe-Preis fuer Tarif "${plan}" konfiguriert. ` +
        'Bitte setzen Sie STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO und STRIPE_PRICE_CLUB.',
      );
    }

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    // Stripe-Kunde erstellen oder wiederverwenden
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: tenant.name,
        metadata: { tenantId: tenant.id, slug: tenant.slug },
      });
      customerId = customer.id;

      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId: customerId },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/einstellungen/abonnement?erfolg=true`,
      cancel_url: `${frontendUrl}/einstellungen/abonnement?abgebrochen=true`,
      metadata: { tenantId, plan },
      locale: 'de',
      subscription_data: {
        metadata: { tenantId, plan },
      },
    });

    this.logger.log(
      `Checkout-Session erstellt fuer Verein ${tenant.name}: ${plan}`,
    );

    return { url: session.url };
  }

  /**
   * Aktuellen Billing-Status abrufen
   */
  async abrufenStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: {
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        trialEndsAt: true,
      },
    });

    let naechsteZahlung: string | null = null;
    let abo: Stripe.Subscription | null = null;

    if (this.stripe && tenant.stripeSubscriptionId) {
      try {
        abo = await this.stripe.subscriptions.retrieve(
          tenant.stripeSubscriptionId,
        );
        const aboData = abo as unknown as Record<string, unknown>;
        if (aboData.current_period_end) {
          naechsteZahlung = new Date(
            (aboData.current_period_end as number) * 1000,
          ).toISOString();
        }
      } catch (fehler) {
        this.logger.error(
          `Fehler beim Abrufen des Stripe-Abos: ${fehler}`,
        );
      }
    }

    // Verbleibende Testtage berechnen
    let testTageVerbleibend: number | null = null;
    if (tenant.trialEndsAt) {
      const jetzt = new Date();
      const diff = tenant.trialEndsAt.getTime() - jetzt.getTime();
      testTageVerbleibend = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return {
      plan: tenant.plan,
      planDetails: PLAN_DETAILS[tenant.plan] || null,
      stripeAktiv: !!tenant.stripeSubscriptionId,
      naechsteZahlung,
      aboStatus: abo?.status || null,
      trialEndsAt: tenant.trialEndsAt?.toISOString() || null,
      testTageVerbleibend,
    };
  }

  /**
   * Stripe Customer Portal-Session erstellen
   */
  async erstellePortalSession(tenantId: string) {
    const stripe = this.stripeAktiv();

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    if (!tenant.stripeCustomerId) {
      throw new BadRequestException(
        'Kein Stripe-Konto vorhanden. Bitte zuerst ein Abonnement abschliessen.',
      );
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${frontendUrl}/einstellungen/abonnement`,
    });

    return { url: session.url };
  }

  /**
   * Stripe-Webhook verarbeiten
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.stripeAktiv();

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET nicht konfiguriert.');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (fehler) {
      this.logger.error(`Webhook-Signatur ungueltig: ${fehler}`);
      throw new BadRequestException('Webhook-Signatur ungueltig.');
    }

    this.logger.log(`Stripe-Webhook empfangen: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        const plan = session.metadata?.plan as Plan | undefined;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription as Stripe.Subscription)?.id;

        if (tenantId && plan && subscriptionId) {
          await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
              stripeCustomerId:
                typeof session.customer === 'string'
                  ? session.customer
                  : (session.customer as Stripe.Customer)?.id,
              stripeSubscriptionId: subscriptionId,
              plan,
            },
          });
          this.logger.log(
            `Verein ${tenantId} hat Tarif "${plan}" abgeschlossen.`,
          );
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : (invoice.subscription as Record<string, string>)?.id;

        if (subscriptionId) {
          const tenant = await this.prisma.tenant.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });
          if (tenant) {
            // Fehlschlag-Zaehler zuruecksetzen bei erfolgreicher Zahlung
            if (tenant.zahlungsFehlschlaege > 0) {
              await this.prisma.tenant.update({
                where: { id: tenant.id },
                data: { zahlungsFehlschlaege: 0 },
              });
            }
            this.logger.log(
              `Zahlung erfolgreich fuer Verein ${tenant.name} (${tenant.id})`,
            );
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : (invoice.subscription as Record<string, string>)?.id;

        if (subscriptionId) {
          const tenant = await this.prisma.tenant.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });
          if (tenant) {
            const fehlschlaege = tenant.zahlungsFehlschlaege + 1;
            const updateData: Record<string, unknown> = {
              zahlungsFehlschlaege: fehlschlaege,
            };

            // Nach 3 fehlgeschlagenen Zahlungen: Verein automatisch sperren
            if (fehlschlaege >= 3) {
              updateData.istAktiv = false;
              updateData.gesperrtAm = new Date();
              updateData.gesperrtGrund =
                `Automatisch gesperrt: ${fehlschlaege} fehlgeschlagene Zahlungen`;
              this.logger.error(
                `Verein ${tenant.name} (${tenant.id}) nach ${fehlschlaege} fehlgeschlagenen Zahlungen GESPERRT.`,
              );
            } else {
              this.logger.warn(
                `Zahlung fehlgeschlagen fuer Verein ${tenant.name} (${tenant.id}). ` +
                `Fehlschlag ${fehlschlaege}/3. Verein wird benachrichtigt.`,
              );
            }

            await this.prisma.tenant.update({
              where: { id: tenant.id },
              data: updateData,
            });

            // Admin-Benutzer des Vereins per E-Mail warnen
            const admins = await this.prisma.user.findMany({
              where: { tenantId: tenant.id, role: { in: ['ADMIN', 'SUPERADMIN'] } },
              select: { email: true, profile: { select: { firstName: true } } },
            });

            for (const admin of admins) {
              try {
                await this.emailQueue?.add('zahlungWarnung', {
                  email: admin.email,
                  vorname: admin.profile?.firstName || 'Admin',
                  vereinsname: tenant.name,
                  fehlschlaege,
                  gesperrt: fehlschlaege >= 3,
                });
              } catch {
                this.logger.warn(`Warn-E-Mail an ${admin.email} konnte nicht gequeued werden`);
              }
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenant = await this.prisma.tenant.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (tenant) {
          await this.prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              plan: 'STARTER',
              stripeSubscriptionId: null,
            },
          });
          this.logger.log(
            `Abo gekuendigt fuer Verein ${tenant.name} (${tenant.id}). Plan zurueckgesetzt auf STARTER.`,
          );
        }
        break;
      }

      default:
        this.logger.debug(`Unbehandelter Webhook-Event: ${event.type}`);
    }

    return { empfangen: true };
  }
}
