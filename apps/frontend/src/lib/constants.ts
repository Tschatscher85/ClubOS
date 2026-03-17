export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const ROUTEN = {
  ANMELDEN: '/anmelden',
  DASHBOARD: '/dashboard',
  MITGLIEDER: '/mitglieder',
  MITARBEITER: '/mitarbeiter',
  TEAMS: '/teams',
  KALENDER: '/kalender',
  TURNIERE: '/turniere',
  NACHRICHTEN: '/nachrichten',
  FAHRGEMEINSCHAFTEN: '/fahrgemeinschaften',
  ELTERN: '/eltern',
  FORMULARE: '/formulare',
  DOKUMENTE: '/dokumente',
  EINSTELLUNGEN: '/einstellungen',
} as const;
