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
  '/verein',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Statische Dateien und API-Routen ignorieren
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ==================== Subdomain-Routing ====================
  const hostname = request.headers.get('host') || '';
  const mainDomain = process.env.NEXT_PUBLIC_DOMAIN || 'clubos.de';

  // Subdomain-Erkennung (nicht fuer localhost)
  if (!hostname.includes('localhost') && !hostname.startsWith('api.')) {
    const teile = hostname.split('.');

    // Subdomain vorhanden wenn mindestens 3 Teile (z.B. fckunchen.clubos.de)
    // und nicht www
    const istSubdomain =
      teile.length >= 3 &&
      !teile[0].startsWith('www') &&
      hostname !== mainDomain;

    if (istSubdomain) {
      const slug = teile[0].toLowerCase();
      const url = request.nextUrl.clone();

      // Nur umschreiben wenn wir nicht schon auf /verein/[slug] sind
      if (!pathname.startsWith(`/verein/${slug}`)) {
        if (pathname === '/' || pathname === '') {
          url.pathname = `/verein/${slug}`;
        } else {
          url.pathname = `/verein/${slug}${pathname}`;
        }
        return NextResponse.rewrite(url);
      }
    }
  }

  // ==================== Auth-Pruefung ====================

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads|sw.js).*)'],
};
