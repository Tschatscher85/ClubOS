# Vereinbase — Claude Code Prompts (Stand: März 2026)

> Vor jedem Prompt: Claude Code liest automatisch `CLAUDE.md` —
> dort ist der komplette Projektkontext hinterlegt.
> Repo: https://github.com/Tschatscher85/Vereinbase

---

## SOFORT — Sicherheit (5 Minuten)
```
# Vereinbase — Passwort aus README entfernen

## Problem
In README.md steht öffentlich sichtbar: Passwort fuer alle: Vereinbase2024!

## Aufgabe
1. In README.md die Zeile "Passwort fuer alle: Vereinbase2024!" entfernen
2. Stattdessen schreiben: "Passwort: siehe .env.example (lokal setzen)"
3. In setup.sh prüfen: wird das Passwort dort hardkodiert gesetzt?
   Falls ja: durch openssl rand -base64 32 ersetzen und in .env schreiben
4. In apps/backend/prisma/seed.ts prüfen: wird Vereinbase2024! verwendet?
   Falls ja: durch process.env.SEED_PASSWORD || 'LocalDev2024!' ersetzen
   und SEED_PASSWORD in .env.example dokumentieren

## Wichtig
Commit-Nachricht: "security: Testpasswort aus öffentlichem README entfernt"
```

---

## Phase 6-A — Vereinshomepage Frontend-Editor
```
# Vereinbase — Vereinshomepage Frontend-Editor

## Kontext
Vereinbase Repo: https://github.com/Tschatscher85/Vereinbase
Das Backend-System für Vereinshomepages ist vollständig fertig (API + DB).
Jetzt braucht es den visuellen Editor im Frontend.

## Was bereits existiert (Backend)
- Vereinshomepage-Model in Prisma mit Sektionen (JSON)
- API-Endpunkte für CRUD der Sektionen
- Öffentliche URL pro Verein bereits geplant

## Aufgabe: Frontend-Editor
Datei: apps/frontend/src/app/(admin)/einstellungen/homepage/page.tsx

### Sektions-Typen die editierbar sein müssen:
1. HERO — Großes Banner mit Titel, Untertitel, Hintergrundbild
2. TEXT — Freier Textbereich (Vereinsnews, Beschreibung)
3. TEAMS — Automatisch aus DB: alle Teams des Vereins anzeigen
4. TERMINE — Automatisch aus DB: nächste 5 Veranstaltungen
5. KONTAKT — Adresse, Telefon, E-Mail, Google Maps Embed
6. GALERIE — Fotos hochladen und anzeigen
7. SPONSOREN — Sponsoren-Logos mit Links

### Editor-Funktionen:
- Sektionen per Drag & Drop sortieren (react-beautiful-dnd)
  npm install react-beautiful-dnd @types/react-beautiful-dnd
- Jede Sektion hat: sichtbar/versteckt Toggle, Bearbeiten-Button, Löschen
- Beim Klick auf Bearbeiten: rechts öffnet sich ein Panel mit Formular
- Speichern: PATCH /vereinshomepage/sektionen (einzelne Sektion)
- Oben: "Vorschau öffnen" → öffnet öffentliche Seite in neuem Tab

### Live-Vorschau (rechte Seite, 50/50 Layout):
- Desktop: Editor links | Vorschau rechts in iframe
- Mobile: Editor oben, Vorschau-Button für Vollbild

### Dateistruktur:
apps/frontend/src/app/(admin)/einstellungen/homepage/
  page.tsx              — Haupt-Editor mit Split-Layout
  components/
    SektionListe.tsx    — Drag & Drop Liste aller Sektionen
    SektionEditor.tsx   — Panel für Einzel-Bearbeitung
    SektionVorschau.tsx — Vorschau-Rendering einer Sektion
    sektionen/
      HeroEditor.tsx
      TextEditor.tsx
      KontaktEditor.tsx

## Wichtig
- Alle Texte deutsch
- shadcn/ui Komponenten verwenden
- Automatisch speichern nach 2 Sekunden Inaktivität (debounce)
- Änderungen ohne Speichern: Browser-Warnung beim Verlassen
```

---

## Phase 6-B — Vereinshomepage öffentliche SSR-Seite
```
# Vereinbase — Vereinshomepage öffentliche Darstellung (SSR)

## Kontext
Vereinbase Repo: https://github.com/Tschatscher85/Vereinbase
Backend für Vereinshomepages ist fertig.
Editor (Phase 6-A) ist fertig.
Jetzt braucht es die öffentliche Seite die Besucher sehen.

## Aufgabe: Öffentliche SSR-Seite
Datei: apps/frontend/src/app/(public)/[vereinSlug]/page.tsx

### Funktionsweise:
- URL: /fckunchen oder fckunchen.vereinbase.de (nach Subdomain-Routing)
- Seite wird Server-Side gerendert (generateMetadata + fetch)
- SEO: automatisch Vereinsname als Title, Logo als og:image
- Lädt: Vereins-Branding (Logo, Farben) + alle aktiven Sektionen

### Sektions-Rendering (für jede Sektion ein React-Komponente):
components/public/
  HeroSektion.tsx     — Vollbreite Banner
  TextSektion.tsx     — Fließtext, Bilder
  TeamsSektion.tsx    — Karten der Mannschaften
  TermineSektion.tsx  — Nächste Veranstaltungen
  KontaktSektion.tsx  — Adresse + Google Maps Embed
  GalerieSektion.tsx  — Foto-Grid
  SponsorenSektion.tsx — Logo-Reihe mit Links

### generateMetadata (SEO):
export async function generateMetadata({ params }) {
  const verein = await fetch(`/api/public/${params.vereinSlug}`).then(r => r.json());
  return {
    title: `${verein.name} — Willkommen`,
    description: verein.beschreibung,
    openGraph: { images: [verein.logo] }
  };
}

### Öffentliche API-Endpoints (kein Auth nötig):
GET /public/:slug        — Vereins-Info + alle aktiven Sektionen
GET /public/:slug/teams  — Teams für TEAMS-Sektion
GET /public/:slug/events — Kommende Events für TERMINE-Sektion

### Navigationsleiste der öffentlichen Seite:
- Vereinslogo links
- Navigationspunkte: Home | Teams | Termine | Kontakt
- Rechts: "Mitglied werden"-Button → /[vereinSlug]/anmelden
- Header in Vereins-Primärfarbe (CSS-Variable aus Branding)

## Wichtig
- next/image für alle Bilder (automatische Optimierung)
- Kein Auth-Guard auf dieser Route
- In middleware.ts: /(public) vom Auth ausschließen
- Tailwind: CSS-Variablen für Vereinsfarben nutzen
```

---

## Phase 6-C — Subdomain-Routing
```
# Vereinbase — Subdomain-Routing für Vereinshomepages

## Kontext
Vereinbase Repo: https://github.com/Tschatscher85/Vereinbase
Ziel: fckunchen.vereinbase.de soll die Vereinshomepage zeigen.
Backend-Tenant-Middleware existiert bereits.

## Aufgabe: Next.js Middleware für Subdomains

### apps/frontend/src/middleware.ts anpassen:
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const mainDomain = process.env.NEXT_PUBLIC_DOMAIN || 'vereinbase.de';

  // Subdomain extrahieren
  const subdomain = hostname.replace(`.${mainDomain}`, '').replace('.localhost:3000', '');

  // Keine Weiterleitung für www, api oder Haupt-Domain
  if (
    subdomain === 'www' ||
    subdomain === 'api' ||
    subdomain === mainDomain ||
    hostname === 'localhost:3000' ||
    !hostname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Subdomain → Vereinshomepage umschreiben
  const url = request.nextUrl.clone();
  url.pathname = `/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

### .env ergänzen:
NEXT_PUBLIC_DOMAIN=vereinbase.de

### Lokal testen (ohne echte Domain):
# In /etc/hosts hinzufügen:
# 127.0.0.1 fckunchen.localhost
# Dann: http://fckunchen.localhost:3000

### DNS-Setup für Produktion (Hetzner):
# A-Record: *.vereinbase.de → [VM-IP]
# Traefik erkennt alle Subdomains automatisch
```

---

## Phase 7-A — 2-Faktor-Authentifizierung (TOTP)
```
# Vereinbase — 2-Faktor-Authentifizierung (TOTP)

## Kontext
Vereinbase Repo: https://github.com/Tschatscher85/Vereinbase
Backend: NestJS + Prisma + PostgreSQL
Auth-Modul existiert: apps/backend/src/auth/

## npm installieren:
npm install otplib qrcode
npm install --save-dev @types/qrcode

## Prisma Schema erweitern:
model User {
  // ... bestehende Felder ...
  twoFactorSecret  String?   // TOTP Secret (verschlüsselt!)
  twoFactorEnabled Boolean   @default(false)
  backupCodes      String[]  // 8 Einmal-Backup-Codes (gehasht)
}

## Backend: apps/backend/src/auth/two-factor/

### Endpunkte:
POST /auth/2fa/einrichten
  1. TOTP-Secret generieren: authenticator.generateSecret()
  2. QR-Code URL erstellen: otpauth://totp/Vereinbase:email?secret=...
  3. QR-Code als Base64-PNG generieren (qrcode.toDataURL)
  4. Secret verschlüsselt in DB speichern (twoFactorEnabled: false)
  5. Response: { qrCode: base64, secret: plaintext, backupCodes: string[] }

POST /auth/2fa/bestaetigen
  Body: { token: string }  — 6-stelliger Code aus Authenticator
  1. Token validieren: authenticator.verify({ token, secret })
  2. twoFactorEnabled: true setzen
  3. Response: { success: true }

POST /auth/2fa/deaktivieren
  Body: { password: string }  — Passwort als Bestätigung
  1. Passwort prüfen
  2. twoFactorEnabled: false, twoFactorSecret: null

### Login-Flow anpassen (auth.service.ts):
Nach Passwort-Prüfung:
  if (user.twoFactorEnabled) {
    // Kein JWT zurückgeben, sondern temporären Token
    return { requires2FA: true, tempToken: signTempToken(user.id) };
  }
  // Normal weiter mit JWT

POST /auth/2fa/verifizieren
  Body: { tempToken: string, code: string }
  1. tempToken validieren
  2. TOTP-Code prüfen
  3. Bei Erfolg: echtes JWT zurückgeben

## Frontend: 2FA-Einrichtung
apps/frontend/src/app/(admin)/einstellungen/sicherheit/page.tsx

Schritte im UI:
1. "2FA aktivieren"-Button → POST /auth/2fa/einrichten
2. QR-Code anzeigen + Secret als Text (für Passwort-Manager)
3. Input: 6-stelligen Code eingeben → POST /auth/2fa/bestaetigen
4. Backup-Codes anzeigen (einmalig, zum Ausdrucken)
5. Bestätigung: "2FA ist jetzt aktiv"

## Frontend: Login mit 2FA
Falls Backend { requires2FA: true } zurückgibt:
→ Zeige zweites Formular: "Authenticator-Code eingeben"
→ POST /auth/2fa/verifizieren
→ Bei Erfolg: JWT speichern wie normal

## Wichtig
- TOTP-Secret in DB verschlüsseln (AES-256 mit ENCRYPTION_KEY aus .env)
- Backup-Codes als bcrypt-Hashes speichern
- Rate Limiting auf 2FA-Endpunkte: max 5 Versuche / 15 Minuten
```

---

## Phase 7-B — Web Push Notifications
```
# Vereinbase — Web Push Notifications (ohne App!)

## Kontext
Vereinbase Repo: https://github.com/Tschatscher85/Vereinbase
Ziel: Mitglieder bekommen Push-Notifications im Browser,
ohne die Mobile App installiert zu haben.

## npm installieren:
npm install web-push
npm install --save-dev @types/web-push

## VAPID-Keys generieren (einmalig, auf Server):
npx web-push generate-vapid-keys
# → Ausgabe in .env speichern:
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=admin@vereinbase.de

## Prisma Schema:
model PushSubscription {
  id           String   @id @default(cuid())
  userId       String
  endpoint     String   @unique
  p256dh       String
  auth         String
  userAgent    String?
  createdAt    DateTime @default(now())
  user         User @relation(fields:[userId],references:[id])
}

## Backend: apps/backend/src/push/

POST /push/abonnieren
  Body: { endpoint, keys: { p256dh, auth }, userAgent? }
  → PushSubscription in DB speichern

DELETE /push/abonnieren
  Body: { endpoint }
  → Subscription löschen

### PushService (push.service.ts):
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err) {
      // 410 Gone = Subscription abgelaufen → löschen
      if (err.statusCode === 410) {
        await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }
}

### In bestehenden Services einbinden:
// In messaging.service.ts nach Broadcast:
await this.pushService.sendToUser(userId, {
  title: `Neue Nachricht von ${trainer.name}`,
  body: nachricht.content.substring(0, 100),
  url: '/nachrichten'
});

// In event.service.ts nach Erinnerung:
await this.pushService.sendToUser(userId, {
  title: `Training in 2 Stunden: ${event.title}`,
  body: `${event.hallName} · ${event.location}`,
  url: '/kalender'
});

## Frontend: Service Worker
apps/frontend/public/sw.js:
self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/logo.png',
    badge: '/badge.png',
    data: { url: data.url }
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  clients.openWindow(event.notification.data.url || '/');
});

## Frontend: Push-Opt-In Komponente
apps/frontend/src/components/PushOptIn.tsx

'use client';
export function PushOptIn() {
  const subscribe = async () => {
    const reg = await navigator.serviceWorker.register('/sw.js');
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    });
    await fetch('/api/push/abonnieren', {
      method: 'POST',
      body: JSON.stringify(sub.toJSON())
    });
  };
  return <button onClick={subscribe}>Push-Benachrichtigungen aktivieren</button>;
}

## .env.local ergänzen:
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...  (der PUBLIC Key von oben)
```

---

## Phase 8 — Stripe Billing
```
# Vereinbase — Stripe Billing Integration

## Kontext
Vereinbase Repo: https://github.com/Tschatscher85/Vereinbase
Ziel: Vereine können per Kreditkarte oder SEPA bezahlen.
30 Tage kostenlos testen, dann automatische Abrechnung.

## npm installieren:
npm install stripe @stripe/stripe-js

## Stripe-Konto einrichten:
1. stripe.com → Konto erstellen
2. API-Keys aus Dashboard holen (Test-Keys für Entwicklung)
3. Webhook-Secret beim Einrichten des Webhooks holen

## .env ergänzen:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

## Stripe Produkte anlegen (einmalig, via Stripe Dashboard):
- Starter: 29 EUR/Monat → Produkt-ID merken
- Pro: 79 EUR/Monat → Produkt-ID merken
- Club: 149 EUR/Monat → Produkt-ID merken

## Prisma Schema erweitern:
model Tenant {
  // ... bestehende Felder ...
  stripeCustomerId       String?
  stripeSubscriptionId   String?
  trialEndsAt            DateTime?
  planActivatedAt        DateTime?
}

## Backend: apps/backend/src/billing/

POST /billing/checkout
  Body: { plan: 'STARTER' | 'PRO' | 'CLUB' }
  1. Stripe Customer anlegen (oder laden)
  2. Checkout Session erstellen mit 30-Tage-Trial
  3. Response: { checkoutUrl: string }
  → Frontend leitet zu Stripe weiter

GET /billing/status
  → Aktueller Plan, Trial-Ende, nächste Zahlung

POST /billing/portal
  → Stripe Customer Portal URL zurückgeben
  → Kunde kann Karte ändern, kündigen etc.

POST /billing/webhook (öffentlich, kein Auth!)
  → Stripe Webhook empfangen
  Wichtige Events:
  - checkout.session.completed → Plan aktivieren
  - invoice.payment_succeeded → Plan verlängern
  - invoice.payment_failed → Mahnung senden
  - customer.subscription.deleted → Plan deaktivieren

### Webhook-Signatur verifizieren:
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);

## Frontend: Billing-Seite
apps/frontend/src/app/(admin)/einstellungen/abonnement/page.tsx

Anzeige:
- Aktueller Plan + Preis
- Trial-Countdown falls aktiv ("noch 23 Tage kostenlos")
- "Plan upgraden" → öffnet Stripe Checkout
- "Zahlungsmethode ändern" → öffnet Stripe Portal
- Rechnungshistorie

## Trial-Guard:
In bestehenden Guards prüfen:
if (tenant.trialEndsAt && tenant.trialEndsAt < new Date() && !tenant.stripeSubscriptionId) {
  throw new ForbiddenException('Testzeitraum abgelaufen. Bitte Abonnement aktivieren.');
}
```

---

## Phase 9 — Expo Mobile App
```
# Vereinbase — Expo Mobile App (apps/mobile/)

## Kontext
Vereinbase Repo: https://github.com/Tschatscher85/Vereinbase
Alle Backend-Endpunkte sind fertig und dokumentiert unter /api/docs.
Jetzt kommt die Mobile App als drittes App im Monorepo.

## Setup:
cd apps
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
npx expo install expo-secure-store expo-notifications expo-constants
npm install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npm install zustand axios

## Projektstruktur: apps/mobile/src/
screens/
  LoginScreen.tsx
  DashboardScreen.tsx
  KalenderScreen.tsx
  NachrichtenScreen.tsx
  TurnierScreen.tsx
  ProfilScreen.tsx
components/
  EventCard.tsx
  NachrichtItem.tsx
  ReaktionButtons.tsx    — JA / NEIN / VIELLEICHT Buttons
  TurniertabelleCard.tsx
stores/
  authStore.ts
  eventsStore.ts
  nachrichtenStore.ts
lib/
  api.ts
  pushTokens.ts

## Auth Store (SecureStore, NICHT AsyncStorage!):
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  tenant: null,
  loadToken: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    const user = await SecureStore.getItemAsync('user');
    if (token) set({ token, user: user ? JSON.parse(user) : null });
  },
  login: async (email, password) => {
    const res = await api.post('/auth/anmelden', { email, password });
    await SecureStore.setItemAsync('accessToken', res.data.accessToken);
    await SecureStore.setItemAsync('user', JSON.stringify(res.data.user));
    set({ token: res.data.accessToken, user: res.data.user });
  },
  logout: async () => {
    await api.post('/auth/abmelden');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('user');
    set({ token: null, user: null });
  },
}));

## API Client:
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,  // http://[VM-IP]:3001
  timeout: 10000,
});

api.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
      // Navigation zu Login (via Store-State)
    }
    return Promise.reject(err);
  }
);

## Bottom Tab Navigator:
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
// Tabs: Dashboard | Kalender | Nachrichten | Turnier | Profil

## .env für Mobile:
EXPO_PUBLIC_API_URL=http://[VM-IP]:3001

## Push Notifications registrieren (nach Login):
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

async function registerPush() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });
  await api.post('/push-tokens', { token: token.data, platform: Platform.OS });
}

## Reihenfolge beim Bauen:
1. LoginScreen + Auth-Flow mit SecureStore
2. DashboardScreen: Willkommen + nächste Events
3. KalenderScreen: Event-Liste + An-/Abmeldung (1 Tap)
4. NachrichtenScreen: Broadcasts + Reaktions-Buttons
5. ProfilScreen: Profil, QR-Ausweis, Abmelden

## EAS Build (App Store + Play Store):
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all --profile preview  # Test-Build
eas build --platform all --profile production  # Release
eas submit --platform ios     # TestFlight
eas submit --platform android # Play Store
```

---

## Bonus — GitHub Actions CI
```
# Vereinbase — GitHub Actions CI/CD Pipeline

## Kontext
Vereinbase Repo: https://github.com/Tschatscher85/Vereinbase
Ziel: Bei jedem Push automatisch TypeScript prüfen + Tests laufen lassen.

## Aufgabe
Datei anlegen: .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  typecheck:
    name: TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build --workspace=packages/shared
      - name: Backend TypeScript
        run: npx tsc --noEmit --project apps/backend/tsconfig.json
      - name: Frontend TypeScript
        run: npx tsc --noEmit --project apps/frontend/tsconfig.json

  lint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint --workspace=apps/backend || true
      - run: npm run lint --workspace=apps/frontend || true

## Datei: .github/workflows/deploy.yml (automatisches Deployment)
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy auf Hetzner VM
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USER }}
          key: ${{ secrets.VM_SSH_KEY }}
          script: |
            cd /opt/vereinbase
            git pull origin main
            npm ci
            docker compose -f docker-compose.prod.yml build
            docker compose -f docker-compose.prod.yml up -d
            docker exec vereinbase-backend npx prisma migrate deploy

## GitHub Secrets anlegen (Repository → Settings → Secrets):
VM_HOST      = [Hetzner VM IP]
VM_USER      = root
VM_SSH_KEY   = [SSH Private Key]
```

---

> **Hinweis:** Diese Prompts bauen auf dem Stand vom 24. Maerz 2026 auf.
> 90+ Backend-Module + 65+ Frontend-Seiten sind fertig.
> Phase 6 (Homepage-Editor, SSR, Subdomain-Routing), Phase 7 (2FA, Web Push)
> sind bereits implementiert. Offene Prompts: Phase 8 (Stripe) und Phase 9 (Mobile App).
> Die Prompts fuer Phase 6-A bis 7-B sind hier zur Referenz erhalten.
