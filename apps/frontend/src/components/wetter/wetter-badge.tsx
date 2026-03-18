'use client';

import { useEffect, useState } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Wind,
  Thermometer,
  Droplets,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

/** Wetterdaten vom Backend */
interface WetterDaten {
  temperatur: number | null;
  regen: number | null;
  windkmh: number | null;
  wettercode: number | null;
  beschreibung: string | null;
}

interface WetterBadgePropsEvent {
  eventId: string;
  lat?: never;
  lng?: never;
  datum?: never;
}

interface WetterBadgePropsKoordinaten {
  eventId?: never;
  lat: number;
  lng: number;
  datum: string;
}

type WetterBadgeProps = WetterBadgePropsEvent | WetterBadgePropsKoordinaten;

/**
 * Wetter-Icon basierend auf WMO-Wettercode
 */
function WetterIcon({ code, className }: { code: number | null; className?: string }) {
  if (code === null) return <Cloud className={className} />;

  // Klar / Ueberwiegend klar
  if (code <= 1) return <Sun className={className} />;
  // Bewoelkt
  if (code <= 3) return <Cloud className={className} />;
  // Nebel
  if (code >= 45 && code <= 48) return <CloudFog className={className} />;
  // Nieselregen
  if (code >= 51 && code <= 55) return <CloudDrizzle className={className} />;
  // Regen
  if (code >= 61 && code <= 65) return <CloudRain className={className} />;
  // Schnee
  if (code >= 71 && code <= 75) return <Snowflake className={className} />;
  // Regenschauer
  if (code >= 80 && code <= 82) return <CloudRain className={className} />;
  // Schneeschauer
  if (code >= 85 && code <= 86) return <Snowflake className={className} />;
  // Gewitter
  if (code >= 95) return <CloudLightning className={className} />;

  return <Cloud className={className} />;
}

/**
 * Hintergrundfarbe basierend auf Wetterbedingungen:
 * - Gruen: Kein Regen, >10 Grad
 * - Gelb: Leichter Regen oder <5 Grad
 * - Rot: Starker Regen, Gewitter, Schnee
 */
function wetterFarbe(wetter: WetterDaten): string {
  const { temperatur, regen, wettercode } = wetter;

  // Rot: Gewitter, starker Regen, Schnee
  if (wettercode !== null) {
    if (wettercode >= 95) return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    if (wettercode >= 71 && wettercode <= 77) return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    if (wettercode >= 85 && wettercode <= 86) return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    if (wettercode === 65 || wettercode === 82) return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
  }

  // Gelb: Leichter Regen oder kalt
  if (regen !== null && regen > 0) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700';
  if (temperatur !== null && temperatur < 5) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700';

  // Gruen: Gutes Wetter
  return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
}

/**
 * WetterBadge — Zeigt eine kompakte Wetter-Anzeige fuer ein Event oder Koordinaten.
 *
 * Verwendung:
 * - Mit Event-ID: <WetterBadge eventId="..." />
 * - Mit Koordinaten: <WetterBadge lat={48.7} lng={9.1} datum="2026-03-20T15:00:00Z" />
 */
export default function WetterBadge(props: WetterBadgeProps) {
  const [wetter, setWetter] = useState<WetterDaten | null>(null);
  const [ladend, setLadend] = useState(true);
  const [fehler, setFehler] = useState(false);

  const eventId = props.eventId;
  const lat = props.lat;
  const lng = props.lng;
  const datum = props.datum;

  useEffect(() => {
    let abgebrochen = false;

    async function wetterLaden() {
      setLadend(true);
      setFehler(false);

      try {
        let daten: WetterDaten;

        if (eventId) {
          daten = await apiClient.get<WetterDaten>(`/wetter/event/${eventId}`);
        } else if (lat !== undefined && lng !== undefined && datum !== undefined) {
          const params = new URLSearchParams();
          params.set('lat', String(lat));
          params.set('lng', String(lng));
          params.set('datum', datum);
          daten = await apiClient.get<WetterDaten>(`/wetter?${params.toString()}`);
        } else {
          setFehler(true);
          setLadend(false);
          return;
        }

        if (!abgebrochen) {
          setWetter(daten);
        }
      } catch {
        if (!abgebrochen) {
          setFehler(true);
        }
      } finally {
        if (!abgebrochen) {
          setLadend(false);
        }
      }
    }

    wetterLaden();

    return () => {
      abgebrochen = true;
    };
  }, [eventId, lat, lng, datum]);

  // Ladezustand
  if (ladend) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted border border-border text-xs animate-pulse">
        <Cloud className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Wetter wird geladen...</span>
      </div>
    );
  }

  // Fehler oder keine Daten — nichts anzeigen
  if (fehler || !wetter) {
    return null;
  }

  const farbKlassen = wetterFarbe(wetter);

  return (
    <div
      className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-md border text-sm ${farbKlassen}`}
      title={wetter.beschreibung ?? 'Wetterdaten'}
    >
      {/* Wetter-Icon + Beschreibung */}
      <div className="flex items-center gap-1.5">
        <WetterIcon code={wetter.wettercode} className="h-4 w-4" />
        <span className="font-medium text-xs">
          {wetter.beschreibung ?? '—'}
        </span>
      </div>

      {/* Temperatur */}
      {wetter.temperatur !== null && (
        <div className="flex items-center gap-0.5" title="Temperatur">
          <Thermometer className="h-3.5 w-3.5" />
          <span className="text-xs">{Math.round(wetter.temperatur)}&deg;C</span>
        </div>
      )}

      {/* Niederschlag */}
      {wetter.regen !== null && wetter.regen > 0 && (
        <div className="flex items-center gap-0.5" title="Niederschlag">
          <Droplets className="h-3.5 w-3.5" />
          <span className="text-xs">{wetter.regen.toFixed(1)} mm</span>
        </div>
      )}

      {/* Wind */}
      {wetter.windkmh !== null && (
        <div className="flex items-center gap-0.5" title="Windgeschwindigkeit">
          <Wind className="h-3.5 w-3.5" />
          <span className="text-xs">{Math.round(wetter.windkmh)} km/h</span>
        </div>
      )}
    </div>
  );
}
