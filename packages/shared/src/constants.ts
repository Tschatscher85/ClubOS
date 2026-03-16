// Bcrypt
export const BCRYPT_ROUNDS = 12;

// Token-Dauern
export const ACCESS_TOKEN_DAUER = '15m';
export const REFRESH_TOKEN_DAUER = '7d';
export const REFRESH_TOKEN_TAGE = 7;

// Validierung
export const PASSWORT_MIN_LAENGE = 8;
export const SLUG_PATTERN = /^[a-z0-9-]+$/;
export const SLUG_MIN_LAENGE = 3;
export const SLUG_MAX_LAENGE = 50;

// Stille-Stunden (Messaging)
export const STILLE_STUNDEN_START = '22:00';
export const STILLE_STUNDEN_ENDE = '07:00';

// Erinnerungen
export const ERINNERUNG_24H_MS = 24 * 60 * 60 * 1000;
export const ERINNERUNG_2H_MS = 2 * 60 * 60 * 1000;

// Pagination
export const STANDARD_SEITEN_GROESSE = 20;
export const MAX_SEITEN_GROESSE = 100;
