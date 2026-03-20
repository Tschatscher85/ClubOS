'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Mail,
  Phone,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/constants';

interface EventLandingData {
  landingpage: {
    titel: string;
    beschreibung: string | null;
    bannerBildUrl: string | null;
    ort: string | null;
    datum: string | null;
    zeitplan: string | null;
    anfahrt: string | null;
    kontaktEmail: string | null;
    kontaktTelefon: string | null;
    seoTitel: string | null;
    seoBeschreibung: string | null;
  };
  event: {
    id: string;
    title: string;
    type: string;
    date: string;
    endDate: string | null;
    location: string;
    hallName: string | null;
    hallAddress: string | null;
    teamName: string;
  };
  teilnahmeStatistik: {
    zusagen: number;
    absagen: number;
    offen: number;
    gesamt: number;
  };
}

const TYP_LABEL: Record<string, string> = {
  TRAINING: 'Training',
  MATCH: 'Spiel',
  TOURNAMENT: 'Turnier',
  EVENT: 'Veranstaltung',
  VOLUNTEER: 'Helfereinsatz',
  TRIP: 'Ausflug',
  MEETING: 'Besprechung',
};

function formatDatumLang(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatUhrzeit(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventLandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [daten, setDaten] = useState<EventLandingData | null>(null);
  const [fehler, setFehler] = useState('');

  useEffect(() => {
    const laden = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/homepage/event/${slug}`);
        if (!res.ok) throw new Error('Nicht gefunden');
        setDaten(await res.json());
      } catch {
        setFehler('Veranstaltung nicht gefunden oder nicht mehr verfuegbar.');
      }
    };
    laden();
  }, [slug]);

  if (fehler) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">{fehler}</p>
        </div>
      </div>
    );
  }

  if (!daten) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  const { landingpage: lp, event, teilnahmeStatistik } = daten;
  const typLabel = TYP_LABEL[event.type] || event.type;

  const handleTeilen = () => {
    if (navigator.share) {
      navigator.share({
        title: lp.titel,
        text: lp.seoBeschreibung || `${typLabel}: ${lp.titel}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link kopiert!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero / Banner */}
      <div
        className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white"
        style={lp.bannerBildUrl ? {
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${lp.bannerBildUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24 text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-4">
            {typLabel}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{lp.titel}</h1>
          {lp.datum && (
            <p className="text-xl text-white/90 mb-2">{lp.datum}</p>
          )}
          {!lp.datum && event.date && (
            <p className="text-xl text-white/90 mb-2">
              {formatDatumLang(event.date)}, {formatUhrzeit(event.date)} Uhr
              {event.endDate && ` — ${formatUhrzeit(event.endDate)} Uhr`}
            </p>
          )}
          {(lp.ort || event.location) && (
            <p className="text-lg text-white/80 flex items-center justify-center gap-2">
              <MapPin className="h-5 w-5" />
              {lp.ort || event.location}
              {event.hallName && ` (${event.hallName})`}
            </p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleTeilen}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Teilen
            </Button>
            {(event.hallAddress || event.location) && (
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                asChild
              >
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(event.hallAddress || event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Route planen
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Info-Karten */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-12">
          <Card className="text-center shadow-lg">
            <CardContent className="pt-4 pb-3">
              <Calendar className="h-6 w-6 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Datum</p>
              <p className="text-sm font-semibold">
                {lp.datum || (event.date ? new Date(event.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—')}
              </p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg">
            <CardContent className="pt-4 pb-3">
              <Clock className="h-6 w-6 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Uhrzeit</p>
              <p className="text-sm font-semibold">
                {event.date ? formatUhrzeit(event.date) : '—'} Uhr
              </p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg">
            <CardContent className="pt-4 pb-3">
              <MapPin className="h-6 w-6 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Ort</p>
              <p className="text-sm font-semibold truncate">
                {event.hallName || lp.ort || event.location || '—'}
              </p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg">
            <CardContent className="pt-4 pb-3">
              <Users className="h-6 w-6 mx-auto mb-1 text-primary" />
              <p className="text-xs text-muted-foreground">Zusagen</p>
              <p className="text-sm font-semibold">
                {teilnahmeStatistik.zusagen} / {teilnahmeStatistik.gesamt}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Beschreibung */}
        {lp.beschreibung && (
          <Card>
            <CardContent className="pt-6 prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: lp.beschreibung }} />
            </CardContent>
          </Card>
        )}

        {/* Zeitplan */}
        {lp.zeitplan && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Zeitplan / Ablauf
              </h2>
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lp.zeitplan }} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Anfahrt */}
        {lp.anfahrt && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Anfahrt
              </h2>
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lp.anfahrt }} />
              </div>
              {(event.hallAddress || event.location) && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(event.hallAddress || event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  In Google Maps oeffnen
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Kontakt */}
        {(lp.kontaktEmail || lp.kontaktTelefon) && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-3">Kontakt</h2>
              <div className="flex flex-wrap gap-4">
                {lp.kontaktEmail && (
                  <a
                    href={`mailto:${lp.kontaktEmail}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {lp.kontaktEmail}
                  </a>
                )}
                {lp.kontaktTelefon && (
                  <a
                    href={`tel:${lp.kontaktTelefon}`}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    {lp.kontaktTelefon}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mannschaft */}
        {event.teamName && (
          <div className="text-center text-sm text-muted-foreground">
            <Badge variant="outline">{event.teamName}</Badge>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 pb-8">
          Powered by Vereinbase
        </div>
      </div>
    </div>
  );
}
