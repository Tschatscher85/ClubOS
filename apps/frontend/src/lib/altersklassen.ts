'use client';

import { apiClient } from './api-client';

const STANDARD_ALTERSKLASSEN = [
  'Bambini', 'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12',
  'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19',
  'Senioren', 'AH',
];

let cache: string[] | null = null;

export async function altersklassenLaden(): Promise<string[]> {
  if (cache) return cache;
  try {
    const daten = await apiClient.get<string[]>('/vereine/altersklassen');
    cache = daten && daten.length > 0 ? daten : STANDARD_ALTERSKLASSEN;
    return cache;
  } catch {
    return STANDARD_ALTERSKLASSEN;
  }
}

export async function altersklassenSpeichern(altersklassen: string[]): Promise<void> {
  await apiClient.put('/vereine/altersklassen', { altersklassen });
  cache = altersklassen;
}

export function altersklassenFallback(): string[] {
  return STANDARD_ALTERSKLASSEN;
}

export function cacheLeeren(): void {
  cache = null;
}
