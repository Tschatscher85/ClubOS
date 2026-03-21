'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Calendar,
  Eye,
  Globe,
  Mail,
  MapPin,
  Phone,
  Shield,
  Star,
  Trophy,
  User,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';

interface SponsorDashboard {
  sponsor: {
    id: string;
    name: string;
    logoUrl: string | null;
    webseite: string | null;
    beschreibung: string | null;
    paketName: string | null;
    betrag: number | null;
    vertragStart: string | null;
    vertragEnde: string | null;
    sichtbarkeit: string[];
    istAktiv: boolean;
  };
  verein: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    primaryColor: string;
    vorstand1Name: string | null;
    vorstand1Funktion: string | null;
    vorstand2Name: string | null;
    vorstand2Funktion: string | null;
    email: string | null;
    telefon: string | null;
    anschrift: string | null;
    plz: string | null;
    ort: string | null;
  };
  naechsteEvents: Array<{
    id: string;
    title: string;
    type: string;
    date: string;
    location: string;
  }>;
  homepage: {
    istAktiv: boolean;
    sponsorSektionAktiv: boolean;
    url: string | null;
  } | null;
  kontakt: {
    vorstand1: { name: string; funktion: string } | null;
    vorstand2: { name: string; funktion: string } | null;
    email: string | null;
    telefon: string | null;
    adresse: string;
  };
}

function formatDatum(datum: string): string {
  return new Date(datum).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatWaehrung(betrag: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(betrag);
}

function eventTypLabel(typ: string): string {
  const labels: Record<string, string> = {
    TRAINING: 'Training',
    MATCH: 'Spiel',
    TOURNAMENT: 'Turnier',
    TRIP: 'Ausflug',
    MEETING: 'Versammlung',
  };
  return labels[typ] || typ;
}

export default function SponsorPortalSeite() {
  const params = useParams();
  const token = params.token as string;
  const [daten, setDaten] = useState<SponsorDashboard | null>(null);
  const [laden, setLaden] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    async function ladeDaten() {
      try {
        const res = await fetch(`${API_BASE_URL}/sponsoren/portal/dashboard/${token}`);
        if (!res.ok) {
          if (res.status === 401) {
            setFehler('Der Link ist ungueltig oder abgelaufen. Bitte fordern Sie einen neuen Login-Link an.');
          } else {
            setFehler('Ein Fehler ist aufgetreten. Bitte versuchen Sie es spaeter erneut.');
          }
          return;
        }
        const data = await res.json();
        setDaten(data);
      } catch {
        setFehler('Verbindungsfehler. Bitte pruefen Sie Ihre Internetverbindung.');
      } finally {
        setLaden(false);
      }
    }
    ladeDaten();
  }, [token]);

  if (laden) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Sponsoren-Portal wird geladen...</p>
        </div>
      </div>
    );
  }

  if (fehler || !daten) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="mx-4 max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <h2 className="text-lg font-semibold">Zugriff nicht moeglich</h2>
            <p className="text-center text-sm text-muted-foreground">
              {fehler || 'Unbekannter Fehler.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { sponsor, verein, naechsteEvents, homepage, kontakt } = daten;
  const primaryColor = verein.primaryColor || '#1a56db';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header
        className="border-b px-4 py-6 text-white sm:px-6 lg:px-8"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4">
            {verein.logo && (
              <img
                src={verein.logo}
                alt={verein.name}
                className="h-12 w-12 rounded-lg bg-white/20 object-contain p-1"
              />
            )}
            <div>
              <p className="text-sm text-white/80">{verein.name}</p>
              <h1 className="text-2xl font-bold sm:text-3xl">Sponsoren-Portal</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Willkommen */}
        <div className="mb-8 flex items-center gap-4">
          {sponsor.logoUrl && (
            <img
              src={sponsor.logoUrl}
              alt={sponsor.name}
              className="h-16 w-16 rounded-xl border bg-white object-contain p-2 shadow-sm"
            />
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Willkommen im Sponsoren-Portal
            </h2>
            <p className="text-muted-foreground">
              {sponsor.name}
              {sponsor.istAktiv ? (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                  Aktiv
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">
                  Inaktiv
                </Badge>
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Ihr Sponsoring */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-amber-500" />
                Ihr Sponsoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sponsor.paketName && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Paket</span>
                  <Badge variant="outline" className="font-semibold">
                    {sponsor.paketName}
                  </Badge>
                </div>
              )}
              {sponsor.betrag != null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Betrag</span>
                  <span className="font-semibold">{formatWaehrung(sponsor.betrag)}</span>
                </div>
              )}
              {sponsor.vertragStart && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Vertragsbeginn</span>
                  <span className="text-sm">{formatDatum(sponsor.vertragStart)}</span>
                </div>
              )}
              {sponsor.vertragEnde && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Vertragsende</span>
                  <span className="text-sm">{formatDatum(sponsor.vertragEnde)}</span>
                </div>
              )}
              {sponsor.beschreibung && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  {sponsor.beschreibung}
                </div>
              )}
              {!sponsor.paketName && !sponsor.betrag && !sponsor.beschreibung && (
                <p className="text-sm text-muted-foreground">
                  Keine Paketdetails hinterlegt. Bitte kontaktieren Sie den Verein.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sichtbarkeit */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5 text-blue-500" />
                Sichtbarkeit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ihr Logo erscheint in folgenden Bereichen:
              </p>
              {sponsor.sichtbarkeit.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sponsor.sichtbarkeit.map((bereich) => (
                    <Badge key={bereich} variant="secondary">
                      {bereich}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Noch keine Sichtbarkeits-Bereiche definiert.
                </p>
              )}

              {homepage && (
                <div className="mt-4 rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">Vereinshomepage</span>
                    {homepage.istAktiv ? (
                      <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-auto">
                        Nicht aktiv
                      </Badge>
                    )}
                  </div>
                  {homepage.sponsorSektionAktiv ? (
                    <p className="mt-1 text-xs text-green-600">
                      Sponsoren-Sektion ist aktiv
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sponsoren-Sektion nicht eingerichtet
                    </p>
                  )}
                  {homepage.url && (
                    <a
                      href={homepage.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                    >
                      {homepage.url}
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Naechste Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-emerald-500" />
                Naechste Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {naechsteEvents.length > 0 ? (
                <ul className="space-y-3">
                  {naechsteEvents.map((event) => (
                    <li key={event.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="rounded-md bg-muted p-2">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDatum(event.date)}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {eventTypLabel(event.type)}
                          </Badge>
                        </div>
                        {event.location && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Keine bevorstehenden Events.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Kontakt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-violet-500" />
                Kontakt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">{verein.name}</p>
                </div>
              </div>

              {kontakt.vorstand1 && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{kontakt.vorstand1.name}</p>
                    <p className="text-xs text-muted-foreground">{kontakt.vorstand1.funktion}</p>
                  </div>
                </div>
              )}

              {kontakt.vorstand2 && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{kontakt.vorstand2.name}</p>
                    <p className="text-xs text-muted-foreground">{kontakt.vorstand2.funktion}</p>
                  </div>
                </div>
              )}

              {kontakt.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${kontakt.email}`} className="text-sm text-blue-600 hover:underline">
                    {kontakt.email}
                  </a>
                </div>
              )}

              {kontakt.telefon && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${kontakt.telefon}`} className="text-sm text-blue-600 hover:underline">
                    {kontakt.telefon}
                  </a>
                </div>
              )}

              {kontakt.adresse && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{kontakt.adresse}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>Bereitgestellt von <span className="font-semibold text-blue-600">Vereinbase</span></p>
          <p className="mt-1">Sponsoren-Portal fuer Sportvereine</p>
        </div>
      </main>
    </div>
  );
}
