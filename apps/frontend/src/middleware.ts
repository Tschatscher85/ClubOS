import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Oeffentliche Routen die keinen Login brauchen
const OEFFENTLICHE_ROUTEN = [
  '/anmelden',
  '/registrieren',
  '/passwort-vergessen',
  '/passwort-zuruecksetzen',
  '/email-verifizieren',
  '/onboarding',
  '/einladung',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Statische Dateien und API-Routen ignorieren
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Oeffentliche Routen durchlassen
  if (OEFFENTLICHE_ROUTEN.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Auth-State ist clientseitig (localStorage/Zustand).
  // Server-seitige Middleware kann das nicht pruefen.
  // Die eigentliche Auth-Pruefung passiert im Dashboard-Layout.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
