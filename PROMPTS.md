# ClubOS — Claude Code Prompts

Alle Prompts sind auf das Repo `Tschatscher85/ClubOS` abgestimmt.
Vor jedem Prompt: Claude Code zuerst `CLAUDE.md` lesen lassen.

---

## Prompt #01 — Eltern-Hallen & Pinwand-System (Phase 2)
```
# ClubOS — Eltern-Hallen & Pinwand-System

## Kontext
ClubOS ist ein Multi-Tenant SaaS für Sportvereine.
Repo: https://github.com/Tschatscher85/ClubOS
Backend: NestJS + Prisma + PostgreSQL (apps/backend/)
Frontend: Next.js 14 + shadcn/ui + Tailwind (apps/frontend/)

## Aufgabe
Baue das Hallen & Pinwand-System für das Eltern-Portal.

## 1. Prisma Schema erweitern (apps/backend/prisma/schema.prisma):
model Location {
  id          String         @id @default(cuid())
  tenantId    String
  name        String
  address     String
  lat         Float?
  lng         Float?
  mapsUrl     String?
  parkingInfo String?
  accessCode  String?
  notes       String?
  teams       TeamLocation[]
  tenant      Tenant @relation(fields: [tenantId], references: [id])
}

model TeamLocation {
  id         String   @id @default(cuid())
  teamId     String
  locationId String
  weekday    Int      // 0=Mo, 1=Di, 2=Mi, 3=Do, 4=Fr, 5=Sa, 6=So
  startTime  String   // z.B. '17:00'
  team       Team @relation(fields: [teamId], references: [id])
  location   Location @relation(fields: [locationId], references: [id])
}

model PinboardItem {
  id       String  @id @default(cuid())
  teamId   String
  title    String
  content  String
  icon     String  @default('info')
  isPinned Boolean @default(false)
  team     Team @relation(fields: [teamId], references: [id])
}

## 2. Backend Module: apps/backend/src/location/
Erstelle LocationModule mit CRUD-Endpoints:
- GET  /orte              — alle Orte des Tenants
- POST /orte              — Ort anlegen (nur Admin/Trainer)
- GET  /orte/:id          — Einzelner Ort mit Google Maps Deeplink
- GET  /pinboard/:teamId  — Pinwand-Inhalte des Teams
- POST /pinboard/:teamId  — Pinwand-Item hinzufügen (nur Trainer)
- PATCH /pinboard/:itemId — Item aktualisieren
- DELETE /pinboard/:itemId — Item löschen

## 3. Frontend: Eltern-Portal Seite
apps/frontend/src/app/(member)/halle/page.tsx

Zeige:
- Hallenname + vollständige Adresse
- Großer "Navigation starten"-Button (Deeplink)
- Parkplatz-Info falls vorhanden
- Zugangscode falls vorhanden
- Pinwand-Items des Teams

## 4. Maps Deeplink-Logik (iOS vs Android):
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const mapsUrl = isIOS
  ? `maps://?q=${lat},${lng}`
  : `https://maps.google.com/?q=${lat},${lng}`;
window.location.href = mapsUrl;

## 5. Admin-UI: Ort-Editor
Seite: apps/frontend/src/app/(admin)/orte/page.tsx
Formular: Name, Adresse, Google Maps URL einfügen.
Auto-Extraktion von lat/lng aus der Maps-URL falls möglich.

## Wichtig:
- Alle deutschen Variablennamen in API-Responses (wie im Repo)
- JWT-Auth via bestehenden AuthGuard
- Tenant-Kontext via bestehenden TenantGuard
```

---

## Prompt #02 — Eltern-FAQ mit KI-Assistent (Phase 2)
```
# ClubOS — Eltern-FAQ mit KI-Auto-Antwort

## Kontext
ClubOS Repo: https://github.com/Tschatscher85/ClubOS
Backend: NestJS + Prisma + PostgreSQL

## Aufgabe
Baue das strukturierte Fragen-System mit KI-Auto-Antworten via OpenAI.
Eltern stellen Fragen — bekannte Antworten kommen sofort automatisch.

## 1. Prisma Schema ergänzen:
model ParentQuestion {
  id           String         @id @default(cuid())
  tenantId     String
  teamId       String
  parentId     String
  question     String
  answer       String?
  autoAnswered Boolean        @default(false)
  status       QuestionStatus @default(OPEN)
  createdAt    DateTime       @default(now())
  answeredAt   DateTime?
  tenant       Tenant @relation(fields: [tenantId], references: [id])
  team         Team @relation(fields: [teamId], references: [id])
  parent       User @relation(fields: [parentId], references: [id])
}

enum QuestionStatus {
  OPEN
  AUTO_ANSWERED
  ANSWERED
}

model FAQ {
  id        String   @id @default(cuid())
  teamId    String
  question  String
  answer    String
  embedding Json?    // Float-Array von OpenAI text-embedding-3-small
  hits      Int      @default(0)
  createdAt DateTime @default(now())
  team      Team @relation(fields: [teamId], references: [id])
}

## 2. .env ergänzen:
OPENAI_API_KEY=sk-...

## 3. npm installieren:
npm install openai

## 4. Backend: apps/backend/src/faq/

POST /fragen
  1. Neue Frage empfangen
  2. OpenAI Embedding berechnen (text-embedding-3-small)
  3. Alle FAQ-Embeddings des Teams aus DB laden
  4. Cosine Similarity für jede FAQ berechnen
  5. Wenn similarity > 0.85: Auto-Antwort zurückgeben, autoAnswered=true
  6. Wenn similarity < 0.85: ParentQuestion anlegen, Trainer benachrichtigen

GET  /fragen/offen         — offene Fragen für Trainer-Dashboard
PATCH /fragen/:id/antworten — Trainer antwortet
  Body: { answer: string, addToFaq: boolean }
  Falls addToFaq=true: Embedding berechnen und FAQ anlegen

## 5. Cosine Similarity (TypeScript):
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}

## 6. OpenAI Embedding aufrufen:
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: question,
});
const embedding = response.data[0].embedding;

## 7. Frontend: Eltern-Seite
apps/frontend/src/app/(member)/fragen/page.tsx
- Textarea: "Stell dem Trainer eine Frage..."
- Submit-Button
- Wenn autoAnswered=true: grüne Antwort-Box sofort anzeigen
- Wenn OPEN: "Deine Frage wurde an den Trainer weitergeleitet"
- Verlauf: alle eigenen Fragen mit Status

## 8. Frontend: Trainer-Dashboard Ergänzung
apps/frontend/src/app/(trainer)/fragen/page.tsx
- Badge mit Anzahl offener Fragen im Nav
- Liste offener Fragen mit Antwort-Textarea
- Checkbox: "Zur FAQ hinzufügen"
```

---

## Prompt #03 — Broadcast-System als WhatsApp-Ersatz (Phase 3)
```
# ClubOS — Broadcast-System (WhatsApp-Ersatz)

## Kontext
ClubOS Repo: https://github.com/Tschatscher85/ClubOS
Backend: NestJS + Prisma + PostgreSQL + BullMQ (Redis bereits im Stack)

## Aufgabe
Trainer schreibt eine Nachricht → alle Mitglieder bekommen sie.
Reaktionen (Ja/Nein/Vielleicht) ersetzen WhatsApp-Antworten.

## 1. Prisma Schema:
model Message {
  id          String          @id @default(cuid())
  tenantId    String
  senderId    String
  teamId      String?
  content     String
  type        MessageType     @default(BROADCAST)
  isEmergency Boolean         @default(false)
  createdAt   DateTime        @default(now())
  reactions   MessageReaction[]
  tenant      Tenant @relation(fields: [tenantId], references: [id])
  sender      User @relation(fields: [senderId], references: [id])
  team        Team? @relation(fields: [teamId], references: [id])
}

enum MessageType { BROADCAST BULLETIN }

model MessageReaction {
  id        String       @id @default(cuid())
  messageId String
  userId    String
  reaction  ReactionType
  createdAt DateTime     @default(now())
  message   Message @relation(fields: [messageId], references: [id])
  user      User @relation(fields: [userId], references: [id])
  @@unique([messageId, userId])
}

enum ReactionType { SEEN YES NO MAYBE }

model NotificationPrefs {
  id                String  @id @default(cuid())
  userId            String  @unique
  pushEnabled       Boolean @default(true)
  emailEnabled      Boolean @default(true)
  quietFrom         Int     @default(20)
  quietTo           Int     @default(8)
  emergencyOverride Boolean @default(true)
  user              User @relation(fields: [userId], references: [id])
}

## 2. Backend: apps/backend/src/messaging/

POST /nachrichten/broadcast
  - Nachricht in DB speichern
  - Alle Teammitglieder laden
  - BullMQ Job: für jeden User stille Stunden prüfen
  - Falls isEmergency=true: stille Stunden ignorieren
  - E-Mail via Mail-Service senden
  - Response: { id, content, recipientCount }

POST /nachrichten/:id/reaktion
  Body: { reaction: 'YES' | 'NO' | 'MAYBE' | 'SEEN' }
  Reaktion upsert (eine pro User+Message)

GET /nachrichten/reaktionen/:id
  Response: { total: 15, seen: 12, yes: 8, no: 3, maybe: 1 }

GET /nachrichten/team/:teamId
  Nachrichten mit eigener Reaktion des eingeloggten Users

## 3. Stille Stunden Check:
function isQuietTime(prefs: NotificationPrefs): boolean {
  const hour = new Date().getHours();
  const { quietFrom, quietTo } = prefs;
  if (quietFrom > quietTo) {
    return hour >= quietFrom || hour < quietTo;
  }
  return hour >= quietFrom && hour < quietTo;
}

## 4. BullMQ: Automatische Erinnerungen (Cron alle 5 Min):
- Events in den nächsten 25-26h prüfen
- Wenn Event in ~24h: Erinnerung mit Hallenlink senden
- Wenn Event in ~2h: Kurze Push-Erinnerung
- reminder_sent Flag in Event-Tabelle setzen (kein doppelter Versand)

## 5. Frontend: Trainer
apps/frontend/src/app/(trainer)/nachrichten/page.tsx
- Textarea + DRINGEND-Checkbox + Senden-Button
- Reaktions-Übersicht: Wer hat Ja/Nein/Vielleicht geklickt
- Gesendete Nachrichten mit Zusammenfassung

## 6. Frontend: Mitglieder
apps/frontend/src/app/(member)/nachrichten/page.tsx
- Nachrichten-Feed (neueste zuerst)
- 3 Buttons pro Nachricht: JA / NEIN / VIELLEICHT
- Grüner Haken wenn bereits reagiert
- Badge-Counter für ungelesene im Nav
```

---

## Prompt #04 — White-Label Branding-System (Phase 5)
```
# ClubOS — White-Label Branding-Editor

## Kontext
ClubOS Repo: https://github.com/Tschatscher85/ClubOS
Backend: NestJS + Prisma
Storage: MinIO (S3-kompatibel, läuft via Docker)

## Aufgabe
Jeder Verein bekommt eigenes Logo, Farben und Subdomain.

## 1. npm installieren:
npm install @aws-sdk/client-s3

## 2. Prisma Schema:
model TenantBranding {
  id             String   @id @default(cuid())
  tenantId       String   @unique
  primaryColor   String   @default('#1E40AF')
  secondaryColor String   @default('#2C5282')
  logoUrl        String?
  faviconUrl     String?
  emailFrom      String?
  emailFromName  String?
  customDomain   String?
  updatedAt      DateTime @updatedAt
  tenant         Tenant @relation(fields: [tenantId], references: [id])
}

## 3. .env ergänzen:
MINIO_ENDPOINT=http://localhost:9000
MINIO_USER=minioadmin
MINIO_PASSWORD=minioadmin

## 4. Backend: apps/backend/src/branding/

GET  /branding             — Branding des aktuellen Tenants (öffentlich)
PATCH /branding            — Farben + E-Mail-Absender aktualisieren (Admin)
POST /branding/logo        — Logo hochladen (Multipart, max 2MB PNG/SVG/JPG)

## 5. MinIO S3-Client:
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'eu-central-1',
  credentials: {
    accessKeyId: process.env.MINIO_USER,
    secretAccessKey: process.env.MINIO_PASSWORD,
  },
  forcePathStyle: true, // Wichtig für MinIO!
});

## 6. Frontend: CSS-Variablen-System (apps/frontend/src/app/layout.tsx):
const branding = await fetchBrandingBySubdomain(host);
const cssVars = {
  '--color-primary': branding.primaryColor,
  '--color-secondary': branding.secondaryColor,
} as React.CSSProperties;
// <html style={cssVars}>

In tailwind.config.ts:
colors: {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
}

## 7. Frontend: Branding-Editor
apps/frontend/src/app/(admin)/einstellungen/branding/page.tsx
- Logo-Upload mit Drag & Drop + aktuelles Logo als Vorschau
- Color-Picker für Primärfarbe (input type="color" + Hex-Input)
- Live-Vorschau der Farben auf Button/Header/Sidebar
- E-Mail-Absender einstellen (emailFrom + emailFromName)
- Speichern-Button

## 8. Subdomain-Middleware (falls noch nicht vorhanden):
// apps/backend/src/common/middleware/tenant.middleware.ts
const host = request.hostname; // z.B. 'fckunchen.clubos.de'
const subdomain = host.split('.')[0];
if (subdomain !== 'www' && subdomain !== 'api') {
  const tenant = await this.tenantService.findBySlug(subdomain);
  request['tenant'] = tenant;
}
```

---

## Prompt #05 — Expo Mobile App (Phase 6)
```
# ClubOS — Expo Mobile App Setup

## Kontext
ClubOS Monorepo: https://github.com/Tschatscher85/ClubOS
Neues Verzeichnis: apps/mobile/

## Aufgabe
Erstelle die Expo React Native App als drittes App im Monorepo.
iOS + Android aus einer Codebasis.

## 1. App anlegen:
cd apps
npx create-expo-app@latest mobile --template blank-typescript
cd mobile

## 2. Dependencies:
npx expo install expo-secure-store expo-notifications expo-constants
npm install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npm install zustand axios

## 3. Ordnerstruktur: apps/mobile/src/
screens/
  LoginScreen.tsx
  DashboardScreen.tsx
  KalenderScreen.tsx
  NachrichtenScreen.tsx
  HalleScreen.tsx
  ProfilScreen.tsx
components/
  EventCard.tsx
  NachrichtItem.tsx
  ReaktionButtons.tsx
stores/
  authStore.ts
  eventsStore.ts
lib/
  api.ts
  pushTokens.ts

## 4. Auth Store (WICHTIG: SecureStore, NICHT AsyncStorage!):
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  loadToken: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) set({ token });
  },
  login: async (email, password) => {
    const res = await api.post('/auth/anmelden', { email, password });
    await SecureStore.setItemAsync('accessToken', res.data.accessToken);
    set({ token: res.data.accessToken, user: res.data.user });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    set({ token: null, user: null });
  },
}));

## 5. API Client:
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL, // http://[VM-IP]:3001
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

## 6. Push Notifications registrieren:
import * as Notifications from 'expo-notifications';

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const token = await Notifications.getExpoPushTokenAsync();
  await api.post('/push-tokens', { token: token.data });
  return token.data;
}

## 7. Reihenfolge beim Bauen:
1. LoginScreen mit JWT-Auth
2. Bottom Tab Navigator (Dashboard / Kalender / Nachrichten / Halle / Profil)
3. KalenderScreen: Event-Liste + An-/Abmeldung per Tap
4. NachrichtenScreen: Broadcasts + Reaktions-Buttons
5. HalleScreen: Hallen-Info + Maps-Deeplink Button

## 8. Starten:
cd apps/mobile
npx expo start
# QR-Code mit Expo Go App scannen
```

---

## Prompt #06 — Digitaler Mitgliedsantrag mit Unterschrift (Phase 4)
```
# ClubOS — Digitaler Mitgliedsantrag mit Unterschrift

## Kontext
ClubOS Repo: https://github.com/Tschatscher85/ClubOS
Backend: NestJS + Prisma
PDF-Generierung: Puppeteer | Storage: MinIO

## Zwei Wege:
Weg A (Selbst): Mitglied ruft /[slug]/anmelden auf, füllt selbst aus
Weg B (Einladung): Trainer gibt E-Mail ein → Link per Mail

## 1. npm installieren:
npm install puppeteer      # Backend — PDF-Generierung
npm install signature_pad  # Frontend — Unterschrift-Canvas

## 2. Prisma Schema:
model MemberForm {
  id          String           @id @default(cuid())
  tenantId    String
  name        String
  fields      Json
  isDefault   Boolean          @default(false)
  submissions FormSubmission[]
  tenant      Tenant @relation(fields: [tenantId], references: [id])
}

model FormSubmission {
  id             String     @id @default(cuid())
  formId         String
  tenantId       String
  data           Json
  signatureData  String     // Base64 PNG
  parentSignData String?    // Eltern-Unterschrift wenn unter 18
  pdfUrl         String?
  status         String     @default('PENDING')
  submittedAt    DateTime   @default(now())
  form           MemberForm @relation(fields: [formId], references: [id])
}

model MemberInvite {
  id        String   @id @default(cuid())
  tenantId  String
  email     String
  teamId    String?
  token     String   @unique @default(cuid())
  status    String   @default('PENDING')
  expiresAt DateTime
  createdAt DateTime @default(now())
  tenant    Tenant @relation(fields: [tenantId], references: [id])
}

## 3. Backend: apps/backend/src/forms/

POST /einladungen
  Body: { email: string, teamId?: string }
  - MemberInvite anlegen (14 Tage gültig)
  - Einladungsmail senden mit Link: /anmelden?token=xxx
  - BullMQ: Erinnerung nach 2 und 5 Tagen

POST /einladungen/:token/einreichen
  Body: FormData { data: JSON, signatureData: base64, parentSignData?: base64 }
  - Token validieren
  - FormSubmission anlegen
  - PDF mit Puppeteer generieren
  - PDF zu MinIO hochladen
  - Admin/Trainer per E-Mail benachrichtigen
  - Invite-Status auf COMPLETED setzen

## 4. Frontend: Öffentliche Anmelde-Seite
apps/frontend/src/app/(public)/[slug]/anmelden/page.tsx

WICHTIG: Route in middleware.ts vom Auth-Guard ausnehmen!

## 5. Unterschrift-Canvas:
'use client';
import SignaturePad from 'signature_pad';
import { useEffect, useRef } from 'react';

export function UnterschriftCanvas({ onSave }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  useEffect(() => {
    padRef.current = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgb(255, 255, 255)',
    });
  }, []);

  const handleSave = () => {
    if (padRef.current.isEmpty()) return;
    onSave(padRef.current.toDataURL('image/png'));
  };

  return (
    <div>
      <canvas ref={canvasRef} width={400} height={200}
        style={{ border: '1px solid #ccc', borderRadius: '8px' }} />
      <button onClick={() => padRef.current.clear()}>Löschen</button>
      <button onClick={handleSave}>Unterschrift bestätigen</button>
    </div>
  );
}

## 6. PDF-Generierung (Puppeteer):
import puppeteer from 'puppeteer';

async function generatePDF(submission) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(`
    <html><body>
      <h1>Mitgliedsantrag</h1>
      <p>Name: ${submission.data.name}</p>
      <p>Datum: ${new Date().toLocaleDateString('de-DE')}</p>
      <hr />
      <p>Unterschrift:</p>
      <img src="${submission.signatureData}" style="height:80px" />
    </body></html>
  `);
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdf;
}

## 7. Trainer-Dashboard: Einladungen verwalten
apps/frontend/src/app/(trainer)/mitglieder/einladen/page.tsx
- E-Mail-Feld + "Einladung senden"-Button
- Tabelle: gesendete Einladungen mit Status (Ausstehend / Ausgefüllt / Abgelaufen)
```

---

> **Hinweis:** Vor jedem Prompt Claude Code die `CLAUDE.md` lesen lassen — dort ist der gesamte Projektkontext hinterlegt.
