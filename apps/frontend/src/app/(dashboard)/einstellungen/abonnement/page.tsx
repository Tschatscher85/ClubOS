'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Check,
  Crown,
  Zap,
  Building2,
  ExternalLink,
  Trophy,
  Shield,
  Users,
  Gift,
  Settings,
  Brain,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';

interface BillingStatus {
  plan: string;
  planDetails: { name: string; preis: string } | null;
  stripeAktiv: boolean;
  naechsteZahlung: string | null;
  aboStatus: string | null;
  trialEndsAt: string | null;
  testTageVerbleibend: number | null;
}

const TARIFE = [
  {
    id: 'STARTER' as const,
    name: 'Starter',
    preis: '29',
    zeitraum: 'Monat',
    beschreibung: 'Fuer kleine Vereine bis 100 Mitglieder',
    icon: Zap,
    farbe: 'text-blue-500',
    features: [
      'Bis zu 100 Mitglieder',
      'Mannschaftsverwaltung',
      'Kalender & Termine',
      'Nachrichten (Broadcast)',
      'Digitaler Mitgliedsausweis',
      'Turnier-Manager',
      'Basis-Statistiken',
    ],
  },
  {
    id: 'PRO' as const,
    name: 'Pro',
    preis: '79',
    zeitraum: 'Monat',
    beschreibung: 'Fuer wachsende Vereine bis 500 Mitglieder',
    icon: Crown,
    farbe: 'text-purple-500',
    beliebt: true,
    features: [
      'Bis zu 500 Mitglieder',
      'Alles aus Starter',
      'Buchhaltung & SEPA',
      'Formular-System (KI)',
      'Workflow-Automatisierung',
      'DFBnet-Integration',
      'Eigene E-Mail-Konfiguration',
      'KI-Trainingsplaene',
      'Spielberichte mit KI',
    ],
  },
  {
    id: 'CLUB' as const,
    name: 'Club',
    preis: '149',
    zeitraum: 'Monat',
    beschreibung: 'Fuer grosse Vereine mit mehreren Sportarten',
    icon: Building2,
    farbe: 'text-amber-500',
    features: [
      'Unbegrenzte Mitglieder',
      'Alles aus Pro',
      'Alle Sportarten',
      'Vereinshomepage-System',
      'Subdomain (verein.clubos.de)',
      'Sponsoren-Modul',
      'Erweiterte Berechtigungen',
      'Prioritaets-Support',
      'Empfehlungsprogramm',
    ],
  },
];

export default function AbonnementPage() {
  const { benutzer } = useAuth();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [ladend, setLadend] = useState(true);
  const [checkoutLadend, setCheckoutLadend] = useState<string | null>(null);
  const [portalLadend, setPortalLadend] = useState(false);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');

  const istAdmin =
    benutzer?.rolle === 'ADMIN' || benutzer?.rolle === 'SUPERADMIN';

  // Erfolgs-/Abbruch-Meldung aus URL-Parametern
  useEffect(() => {
    if (searchParams.get('erfolg') === 'true') {
      setErfolg('Abonnement erfolgreich abgeschlossen! Vielen Dank.');
      // URL bereinigen
      window.history.replaceState({}, '', '/einstellungen/abonnement');
    }
    if (searchParams.get('abgebrochen') === 'true') {
      setFehler('Checkout wurde abgebrochen.');
      window.history.replaceState({}, '', '/einstellungen/abonnement');
    }
  }, [searchParams]);

  // Billing-Status laden
  useEffect(() => {
    if (!istAdmin) {
      setLadend(false);
      return;
    }

    const statusLaden = async () => {
      try {
        const daten = await apiClient.get<BillingStatus>('/billing/status');
        setStatus(daten);
      } catch {
        // Billing ggf. nicht konfiguriert
      } finally {
        setLadend(false);
      }
    };
    statusLaden();
  }, [istAdmin]);

  const handleCheckout = async (plan: 'STARTER' | 'PRO' | 'CLUB') => {
    setCheckoutLadend(plan);
    setFehler('');
    try {
      const ergebnis = await apiClient.post<{ url: string }>('/billing/checkout', {
        plan,
      });
      if (ergebnis.url) {
        window.location.href = ergebnis.url;
      }
    } catch (err) {
      setFehler(
        err instanceof Error ? err.message : 'Fehler beim Erstellen der Checkout-Session.',
      );
    } finally {
      setCheckoutLadend(null);
    }
  };

  const handlePortal = async () => {
    setPortalLadend(true);
    setFehler('');
    try {
      const ergebnis = await apiClient.post<{ url: string }>('/billing/portal', {});
      if (ergebnis.url) {
        window.location.href = ergebnis.url;
      }
    } catch (err) {
      setFehler(
        err instanceof Error
          ? err.message
          : 'Fehler beim Oeffnen des Kundenportals.',
      );
    } finally {
      setPortalLadend(false);
    }
  };

  if (!istAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Abonnement</h1>
        <p className="text-muted-foreground">
          Nur Administratoren koennen das Abonnement verwalten.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Abonnement</h1>
          <p className="text-muted-foreground">
            Tarif verwalten und Zahlungsdetails einsehen
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        <Link href="/einstellungen">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <Settings className="h-3 w-3 mr-1" />
            Verein
          </Badge>
        </Link>
        <Link href="/einstellungen/vereinsdaten">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <Building2 className="h-3 w-3 mr-1" />
            Vereinsdaten
          </Badge>
        </Link>
        <Link href="/einstellungen/sportarten">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <Trophy className="h-3 w-3 mr-1" />
            Sportarten
          </Badge>
        </Link>
        <Badge variant="default" className="cursor-default">
          <CreditCard className="h-3 w-3 mr-1" />
          Abonnement
        </Badge>
        <Link href="/einstellungen/beitraege">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <CreditCard className="h-3 w-3 mr-1" />
            Beitraege
          </Badge>
        </Link>
        <Link href="/einstellungen/rollen">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <Shield className="h-3 w-3 mr-1" />
            Rollen
          </Badge>
        </Link>
        <Link href="/einstellungen/benutzer">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <Users className="h-3 w-3 mr-1" />
            Benutzer
          </Badge>
        </Link>
        <Link href="/einstellungen/empfehlen">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <Gift className="h-3 w-3 mr-1" />
            Empfehlen
          </Badge>
        </Link>
        <a href="/einstellungen#ki-einstellungen">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <Brain className="h-3 w-3 mr-1" />
            KI
          </Badge>
        </a>
        <a href="/einstellungen#email-einstellungen">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            <Mail className="h-3 w-3 mr-1" />
            E-Mail
          </Badge>
        </a>
      </div>

      {/* Erfolgsmeldung */}
      {erfolg && (
        <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950 p-4 text-green-700 dark:text-green-300">
          {erfolg}
        </div>
      )}

      {/* Fehlermeldung */}
      {fehler && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-red-700 dark:text-red-300">
          {fehler}
        </div>
      )}

      {/* Aktueller Status */}
      {!ladend && status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Aktueller Tarif
              <Badge
                variant={status.plan === 'STARTER' ? 'secondary' : 'default'}
                className="text-sm"
              >
                {status.planDetails?.name || status.plan}
              </Badge>
            </CardTitle>
            <CardDescription>
              {status.planDetails?.preis || 'Kostenlos'}
              {status.naechsteZahlung && (
                <> — Naechste Zahlung am{' '}
                  {new Date(status.naechsteZahlung).toLocaleDateString('de-DE')}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Testzeitraum-Anzeige */}
            {status.testTageVerbleibend !== null &&
              status.testTageVerbleibend > 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950 p-4">
                  <p className="font-medium text-amber-700 dark:text-amber-300">
                    Noch {status.testTageVerbleibend} Tage kostenlos testen
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    Ihr Testzeitraum endet am{' '}
                    {new Date(status.trialEndsAt!).toLocaleDateString('de-DE')}.
                    Schliessen Sie jetzt ein Abo ab, um den vollen Funktionsumfang zu behalten.
                  </p>
                </div>
              )}

            {/* Testzeitraum abgelaufen */}
            {status.testTageVerbleibend !== null &&
              status.testTageVerbleibend <= 0 &&
              !status.stripeAktiv && (
                <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4">
                  <p className="font-medium text-red-700 dark:text-red-300">
                    Testzeitraum abgelaufen
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Bitte schliessen Sie ein Abonnement ab, um ClubOS weiterhin zu nutzen.
                  </p>
                </div>
              )}

            {/* Portal-Button */}
            {status.stripeAktiv && (
              <Button
                variant="outline"
                onClick={handlePortal}
                disabled={portalLadend}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {portalLadend
                  ? 'Wird geoeffnet...'
                  : 'Zahlungsdetails verwalten'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tarif-Vergleichskarten */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Tarife vergleichen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TARIFE.map((tarif) => {
            const Icon = tarif.icon;
            const istAktuellerPlan = status?.plan === tarif.id;

            return (
              <Card
                key={tarif.id}
                className={`relative ${
                  tarif.beliebt
                    ? 'border-primary shadow-lg'
                    : ''
                } ${istAktuellerPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {tarif.beliebt && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Beliebtester Tarif
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2">
                    <Icon className={`h-10 w-10 ${tarif.farbe}`} />
                  </div>
                  <CardTitle className="text-xl">{tarif.name}</CardTitle>
                  <CardDescription>{tarif.beschreibung}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tarif.preis}</span>
                    <span className="text-muted-foreground ml-1">
                      EUR/{tarif.zeitraum}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {tarif.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {istAktuellerPlan ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Aktueller Tarif
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={tarif.beliebt ? 'default' : 'outline'}
                      onClick={() => handleCheckout(tarif.id)}
                      disabled={!!checkoutLadend}
                    >
                      {checkoutLadend === tarif.id
                        ? 'Wird geladen...'
                        : istAktuellerPlan
                          ? 'Aktueller Tarif'
                          : 'Jetzt freischalten'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info-Karte */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Sicher bezahlen mit Stripe.</strong> Ihre Zahlungsdaten werden
                nie auf unseren Servern gespeichert.
              </p>
              <p>
                Alle Tarife sind monatlich kuendbar. Nach einer Kuendigung laeuft
                Ihr Abonnement bis zum Ende des bezahlten Zeitraums weiter.
              </p>
              <p>
                DSGVO-konform: Alle Daten auf deutschen Servern (Hetzner).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
