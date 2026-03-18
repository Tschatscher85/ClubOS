// Zentrale Sportarten-Verwaltung
// Laedt Sportarten aus der API und cached sie im Speicher

import { apiClient } from '@/lib/api-client';

export interface Sportart {
  id: string;
  name: string;
  beschreibung: string;
  icon: string;
  istVordefiniert: boolean;
}

// Fallback falls API nicht erreichbar
const FALLBACK_SPORTARTEN: Array<{ wert: string; label: string }> = [
  { wert: 'FUSSBALL', label: 'Fussball' },
  { wert: 'HANDBALL', label: 'Handball' },
  { wert: 'BASKETBALL', label: 'Basketball' },
  { wert: 'FOOTBALL', label: 'Football' },
  { wert: 'TENNIS', label: 'Tennis' },
  { wert: 'TURNEN', label: 'Turnen' },
  { wert: 'SCHWIMMEN', label: 'Schwimmen' },
  { wert: 'LEICHTATHLETIK', label: 'Leichtathletik' },
  { wert: 'SONSTIGES', label: 'Sonstiges' },
];

let cachedSportarten: Sportart[] | null = null;
let ladePromise: Promise<Sportart[]> | null = null;

/**
 * Sportarten aus der API laden (mit Cache)
 */
export async function sportartenLaden(): Promise<Sportart[]> {
  if (cachedSportarten) return cachedSportarten;

  if (ladePromise) return ladePromise;

  ladePromise = apiClient
    .get<Sportart[]>('/sportarten')
    .then((daten) => {
      cachedSportarten = daten;
      return daten;
    })
    .catch(() => {
      // Fallback: Vordefinierte Sportarten als Sportart-Objekte
      cachedSportarten = FALLBACK_SPORTARTEN.map((s, i) => ({
        id: `fallback-${i}`,
        name: s.label,
        beschreibung: '',
        icon: '',
        istVordefiniert: true,
      }));
      return cachedSportarten;
    })
    .finally(() => {
      ladePromise = null;
    });

  return ladePromise;
}

/**
 * Cache leeren (z.B. nach Aenderungen in den Einstellungen)
 */
export function sportartenCacheLeeren(): void {
  cachedSportarten = null;
}

/**
 * Sportarten als Wert/Label-Paare fuer Dropdowns
 */
export async function sportartenAlsOptionen(): Promise<Array<{ wert: string; label: string }>> {
  const sportarten = await sportartenLaden();
  return sportarten.map((s) => ({
    wert: s.istVordefiniert ? s.name.toUpperCase().replace(/[^A-Z]/g, '') || s.name : s.name,
    label: s.name,
  }));
}

/**
 * Sportarten-Label-Map fuer schnelle Anzeige
 */
export async function sportartenLabelMap(): Promise<Record<string, string>> {
  const sportarten = await sportartenLaden();
  const map: Record<string, string> = {};
  for (const s of sportarten) {
    // Key = uppercase ohne Umlaute (fuer Kompatibilitaet mit bestehenden Daten)
    const key = s.istVordefiniert
      ? s.name.toUpperCase().replace('Ü', 'UE').replace('Ä', 'AE').replace('Ö', 'OE').replace(/[^A-Z]/g, '') || s.name.toUpperCase()
      : s.name;
    map[key] = s.name;
    // Auch den originalen Namen als Key
    map[s.name] = s.name;
    map[s.name.toUpperCase()] = s.name;
  }
  return map;
}

/**
 * Synchrone Fallback-Sportarten (wenn API noch nicht geladen)
 */
export function sportartenFallback(): Array<{ wert: string; label: string }> {
  if (cachedSportarten) {
    return cachedSportarten.map((s) => ({
      wert: s.istVordefiniert ? s.name.toUpperCase().replace(/[^A-Z]/g, '') || s.name : s.name,
      label: s.name,
    }));
  }
  return FALLBACK_SPORTARTEN;
}

/**
 * Synchrones Label-Lookup (mit Fallback)
 */
export function sportartLabel(wert: string): string {
  if (cachedSportarten) {
    const gefunden = cachedSportarten.find(
      (s) =>
        s.name === wert ||
        s.name.toUpperCase() === wert ||
        s.name.toUpperCase().replace('Ü', 'UE').replace('Ä', 'AE').replace('Ö', 'OE').replace(/[^A-Z]/g, '') === wert,
    );
    if (gefunden) return gefunden.name;
  }
  // Fallback
  const fb = FALLBACK_SPORTARTEN.find((s) => s.wert === wert);
  return fb?.label || wert;
}
