'use client';

import { apiClient } from './api-client';

export interface VeranstaltungsTyp {
  wert: string;
  label: string;
}

const STANDARD_TYPEN: VeranstaltungsTyp[] = [
  { wert: 'TRAINING', label: 'Training' },
  { wert: 'MATCH', label: 'Spiel' },
  { wert: 'TOURNAMENT', label: 'Turnier' },
  { wert: 'EVENT', label: 'Veranstaltung' },
  { wert: 'VOLUNTEER', label: 'Helfereinsatz' },
  { wert: 'TRIP', label: 'Ausflug' },
  { wert: 'MEETING', label: 'Besprechung' },
];

let cache: VeranstaltungsTyp[] | null = null;

export async function veranstaltungstypenLaden(): Promise<VeranstaltungsTyp[]> {
  if (cache) return cache;
  try {
    const daten = await apiClient.get<VeranstaltungsTyp[]>('/vereine/veranstaltungstypen');
    cache = daten && daten.length > 0 ? daten : STANDARD_TYPEN;
    return cache;
  } catch {
    return STANDARD_TYPEN;
  }
}

export async function veranstaltungstypenSpeichern(typen: VeranstaltungsTyp[]): Promise<void> {
  await apiClient.put('/vereine/veranstaltungstypen', { typen });
  cache = typen;
}

export function veranstaltungstypenFallback(): VeranstaltungsTyp[] {
  return STANDARD_TYPEN;
}

export function cacheLeeren(): void {
  cache = null;
}
