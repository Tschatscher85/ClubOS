import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Wetterdaten-Rueckgabe */
export interface WetterDaten {
  temperatur: number | null;
  regen: number | null;
  windkmh: number | null;
  wettercode: number | null;
  beschreibung: string | null;
}

/** WMO Wettercodes auf Deutsch */
const WETTER_BESCHREIBUNG: Record<number, string> = {
  0: 'Klar',
  1: 'Ueberwiegend klar',
  2: 'Teilweise bewoelkt',
  3: 'Bedeckt',
  45: 'Nebel',
  48: 'Nebel mit Reif',
  51: 'Leichter Nieselregen',
  53: 'Nieselregen',
  55: 'Starker Nieselregen',
  61: 'Leichter Regen',
  63: 'Regen',
  65: 'Starker Regen',
  71: 'Leichter Schneefall',
  73: 'Schneefall',
  75: 'Starker Schneefall',
  80: 'Leichte Regenschauer',
  81: 'Regenschauer',
  82: 'Starke Regenschauer',
  85: 'Leichte Schneeschauer',
  86: 'Starke Schneeschauer',
  95: 'Gewitter',
  96: 'Gewitter mit Hagel',
  99: 'Starkes Gewitter mit Hagel',
};

/** Maximales Cache-Alter in Millisekunden (3 Stunden) */
const CACHE_MAX_ALTER_MS = 3 * 60 * 60 * 1000;

/** Timeout fuer Open-Meteo API-Aufrufe in Millisekunden */
const API_TIMEOUT_MS = 10_000;

@Injectable()
export class WetterService {
  private readonly logger = new Logger(WetterService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Wetterdaten fuer einen Ort und Zeitpunkt abrufen.
   * Nutzt den Cache (max 3 Stunden alt), sonst Open-Meteo API.
   */
  async getWetter(lat: number, lng: number, datum: Date): Promise<WetterDaten | null> {
    // 1. Cache pruefen (max 3 Stunden alt)
    const cacheDatum = this.stundeRunden(datum);
    const cachedWetter = await this.ausCache(lat, lng, cacheDatum);
    if (cachedWetter) {
      this.logger.debug(`Wetter aus Cache fuer ${lat},${lng} am ${cacheDatum.toISOString()}`);
      return cachedWetter;
    }

    // 2. Von Open-Meteo laden
    try {
      const wetter = await this.vonApiLaden(lat, lng, datum);
      if (!wetter) {
        return null;
      }

      // 3. In Cache speichern
      await this.inCacheSpeichern(lat, lng, cacheDatum, wetter);

      return wetter;
    } catch (fehler) {
      this.logger.error(`Fehler beim Laden der Wetterdaten: ${fehler}`);
      return null;
    }
  }

  /**
   * Wetterdaten fuer ein Event anhand der eventId abrufen.
   * Gibt null zurueck wenn kein lat/lng beim Event hinterlegt ist.
   */
  async getWetterFuerEvent(eventId: string, tenantId: string): Promise<WetterDaten | null> {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, tenantId },
      select: { lat: true, lng: true, date: true },
    });

    if (!event || event.lat === null || event.lng === null) {
      return null;
    }

    return this.getWetter(event.lat, event.lng, event.date);
  }

  /**
   * Datum auf volle Stunde runden (fuer Cache-Key)
   */
  private stundeRunden(datum: Date): Date {
    const gerundet = new Date(datum);
    gerundet.setMinutes(0, 0, 0);
    return gerundet;
  }

  /**
   * Wetterdaten aus dem Cache laden (max 3 Stunden alt)
   */
  private async ausCache(lat: number, lng: number, datum: Date): Promise<WetterDaten | null> {
    const minAlter = new Date(Date.now() - CACHE_MAX_ALTER_MS);

    const cached = await this.prisma.wetterCache.findUnique({
      where: {
        lat_lng_datum: { lat, lng, datum },
      },
    });

    if (!cached || cached.geladenAm < minAlter) {
      return null;
    }

    return {
      temperatur: cached.temperatur,
      regen: cached.regen,
      windkmh: cached.windkmh,
      wettercode: cached.wettercode,
      beschreibung: cached.beschreibung,
    };
  }

  /**
   * Wetterdaten in den Cache schreiben (upsert)
   */
  private async inCacheSpeichern(
    lat: number,
    lng: number,
    datum: Date,
    wetter: WetterDaten,
  ): Promise<void> {
    try {
      await this.prisma.wetterCache.upsert({
        where: {
          lat_lng_datum: { lat, lng, datum },
        },
        update: {
          temperatur: wetter.temperatur,
          regen: wetter.regen,
          windkmh: wetter.windkmh,
          wettercode: wetter.wettercode,
          beschreibung: wetter.beschreibung,
          geladenAm: new Date(),
        },
        create: {
          lat,
          lng,
          datum,
          temperatur: wetter.temperatur,
          regen: wetter.regen,
          windkmh: wetter.windkmh,
          wettercode: wetter.wettercode,
          beschreibung: wetter.beschreibung,
        },
      });
    } catch (fehler) {
      this.logger.warn(`Cache-Speicherung fehlgeschlagen: ${fehler}`);
    }
  }

  /**
   * Wetterdaten von der Open-Meteo API laden (DSGVO-konform, kein API-Key noetig)
   */
  private async vonApiLaden(lat: number, lng: number, datum: Date): Promise<WetterDaten | null> {
    const datumStr = datum.toISOString().slice(0, 10); // YYYY-MM-DD
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&hourly=temperature_2m,precipitation,windspeed_10m,weathercode` +
      `&timezone=Europe/Berlin` +
      `&start_date=${datumStr}&end_date=${datumStr}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const antwort = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!antwort.ok) {
        this.logger.warn(`Open-Meteo API Fehler: ${antwort.status} ${antwort.statusText}`);
        return null;
      }

      const daten = await antwort.json() as {
        hourly?: {
          time?: string[];
          temperature_2m?: (number | null)[];
          precipitation?: (number | null)[];
          windspeed_10m?: (number | null)[];
          weathercode?: (number | null)[];
        };
      };

      if (!daten.hourly?.time || daten.hourly.time.length === 0) {
        this.logger.warn('Keine stuendlichen Daten von Open-Meteo erhalten');
        return null;
      }

      // Passende Stunde finden
      const zielStunde = datum.getHours();
      const stundenIndex = Math.min(zielStunde, daten.hourly.time.length - 1);

      const temperatur = daten.hourly.temperature_2m?.[stundenIndex] ?? null;
      const regen = daten.hourly.precipitation?.[stundenIndex] ?? null;
      const windkmh = daten.hourly.windspeed_10m?.[stundenIndex] ?? null;
      const wettercode = daten.hourly.weathercode?.[stundenIndex] ?? null;
      const beschreibung = wettercode !== null
        ? (WETTER_BESCHREIBUNG[wettercode] ?? `Wettercode ${wettercode}`)
        : null;

      return { temperatur, regen, windkmh, wettercode, beschreibung };
    } catch (fehler) {
      clearTimeout(timeout);
      if (fehler instanceof DOMException && fehler.name === 'AbortError') {
        this.logger.warn('Open-Meteo API Timeout nach 10 Sekunden');
      } else {
        this.logger.error(`Open-Meteo API Fehler: ${fehler}`);
      }
      return null;
    }
  }
}
