export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const ROUTEN = {
  ANMELDEN: '/anmelden',
  DASHBOARD: '/dashboard',
  MITGLIEDER: '/mitglieder',
  TEAMS: '/teams',
  KALENDER: '/kalender',
  TURNIERE: '/turniere',
  NACHRICHTEN: '/nachrichten',
  FAHRGEMEINSCHAFTEN: '/fahrgemeinschaften',
  ELTERN: '/eltern',
  EINSTELLUNGEN: '/einstellungen',
} as const;
