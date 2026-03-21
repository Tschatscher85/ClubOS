# Vereinbase — Projektkontext für Claude Code

## 🎯 Was wird gebaut
Vereinbase ist eine Multi-Tenant SaaS-Plattform für Sportvereine in Deutschland.
Sie ersetzt WhatsApp-Gruppen, Spielerplus, easyVerein, Doodle, Google Sheets
und Turnierheld — alles in einer App, DSGVO-konform, mit deutschem Server.

**Kernversprechen an Vereine:**
"Kündigt alle 6 Apps. Vereinbase ersetzt WhatsApp-Gruppen, Spielerplus, easyVerein
und euren Turnierheld — für einen monatlichen Preis, mit deutschem Server,
DSGVO-konform. Der Trainer gibt seine private Nummer nie wieder raus."

---

## 🛠️ Tech Stack

### Backend
- **Framework:** NestJS + TypeScript
- **Datenbank:** PostgreSQL (Multi-Tenant mit Row-Level Security, Schema-per-Tenant)
- **ORM:** Prisma
- **Auth:** JWT + Refresh Tokens + OAuth (Google)
- **Queue:** BullMQ (für Mails, Push-Notifications, Erinnerungen)
- **Storage:** S3-kompatibel (Hetzner ObjectStorage)
- **API:** REST + GraphQL (für Mobile App)
- **Realtime:** Socket.io (für Turnier-Live-Anzeige und Chat)

### Frontend (Web)
- **Framework:** Next.js 14+ (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **Charts:** Recharts
- **State:** Zustand
- **Echtzeit:** React + WebSockets

### Mobile App
- **Framework:** Expo (React Native)
- **Eine Codebasis** → iOS & Android
- **Push:** Expo Notifications
- **Offline:** MMKV Storage

### DevOps
- **Container:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Cloud:** Hetzner Ubuntu 24.04 (DSGVO-konform, Deutschland)
- **Reverse Proxy:** Traefik (automatische SSL-Zertifikate)
- **Monitoring:** Uptime Kuma

---

## 📁 Projektstruktur (Monorepo)

```
vereinbase/
├── apps/
│   ├── backend/          # NestJS API
│   ├── frontend/         # Next.js Web-App
│   └── mobile/           # Expo React Native App
├── packages/
│   └── shared/           # Gemeinsame Types, Utils, Interfaces
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── turbo.json
└── CLAUDE.md
```

---

## 🗄️ Datenmodell (Prisma Schema)

```prisma
model Tenant {
  id           String   @id @default(cuid())
  name         String                          // Vereinsname
  slug         String   @unique               // URL-Slug: fckunchen
  logo         String?                         // Logo-URL
  primaryColor String   @default("#1a56db")   // Vereinsfarbe
  plan         Plan     @default(STARTER)
  domain       String?                         // Optional: eigene Domain
  createdAt    DateTime @default(now())
  users        User[]
  teams        Team[]
  events       Event[]
  tournaments  Tournament[]
  members      Member[]
  formTemplates FormTemplate[]
}

enum Plan {
  STARTER    // 29€/Monat, <100 Mitglieder
  PRO        // 79€/Monat, <500 Mitglieder
  CLUB       // 149€/Monat, alle Sportarten
  ENTERPRISE // individuell, Verbände
  SELF_HOSTED // 499€ einmalig
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?
  role         Role
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  profile      Member?
  createdAt    DateTime @default(now())
}

enum Role {
  SUPERADMIN  // Plattform-Admin (du)
  ADMIN       // Vereinsvorstand
  TRAINER     // Trainer/Mitarbeiter
  MEMBER      // Vereinsmitglied
  PARENT      // Elternteil
}

model Member {
  id           String    @id @default(cuid())
  userId       String?   @unique
  user         User?     @relation(fields: [userId], references: [id])
  tenantId     String
  memberNumber String
  firstName    String
  lastName     String
  birthDate    DateTime?
  phone        String?
  address      String?
  joinDate     DateTime  @default(now())
  status       MemberStatus @default(PENDING)
  sport        String[]
  qrCode       String?   // Digitaler Mitgliedsausweis
  parentEmail  String?   // Für Jugend: Eltern-E-Mail
  signatureUrl String?   // Digitale Unterschrift
}

enum MemberStatus {
  PENDING    // Antrag gestellt, wartet auf Freigabe
  ACTIVE     // Aktives Mitglied
  INACTIVE   // Inaktiv
  CANCELLED  // Ausgetreten
}

model Team {
  id        String  @id @default(cuid())
  name      String
  sport     Sport
  ageGroup  String  // U6, U8, U10, ... Senioren
  trainerId String
  tenantId  String
  events    Event[]
}

enum Sport {
  FUSSBALL
  HANDBALL
  BASKETBALL
  FOOTBALL
  TENNIS
  TURNEN
  SCHWIMMEN
  LEICHTATHLETIK
  SONSTIGES
}

model Event {
  id          String    @id @default(cuid())
  title       String
  type        EventType
  date        DateTime
  endDate     DateTime?
  location    String
  hallName    String?   // Hallenname für Pinwand
  hallAddress String?   // Adresse für Google Maps Link
  teamId      String
  tenantId    String
  notes       String?
  attendances Attendance[]
  reminders   Reminder[]
}

enum EventType {
  TRAINING
  MATCH
  TOURNAMENT
  TRIP
  MEETING
}

model Attendance {
  id        String           @id @default(cuid())
  eventId   String
  memberId  String
  status    AttendanceStatus @default(PENDING)
  reason    String?          // Pflichtfeld bei Absage
  answeredAt DateTime?
}

enum AttendanceStatus {
  PENDING   // Noch nicht geantwortet
  YES       // Kommt
  NO        // Kommt nicht
  MAYBE     // Vielleicht
}

model Tournament {
  id        String          @id @default(cuid())
  name      String
  sport     Sport
  format    TournamentFormat
  publicUrl String          @unique  // Öffentliche Live-URL für Leinwand
  tenantId  String
  isLive    Boolean         @default(false)
  matches   TournamentMatch[]
  qrCode    String?
}

enum TournamentFormat {
  GRUPPE
  KO
  SCHWEIZER
  KOMBINATION
}

model TournamentMatch {
  id           String    @id @default(cuid())
  tournamentId String
  team1        String
  team2        String
  score1       Int?
  score2       Int?
  time         DateTime?
  field        String?   // Spielfeld
  status       MatchStatus @default(GEPLANT)
}

enum MatchStatus {
  GEPLANT
  LAUFEND
  BEENDET
  ABGESAGT
}

model FormTemplate {
  id         String  @id @default(cuid())
  tenantId   String
  name       String
  type       FormType
  fileUrl    String  // Original-Datei (PDF/DOCX)
  fields     Json    // Formularfelder als JSON
  isActive   Boolean @default(true)
}

enum FormType {
  MITGLIEDSANTRAG
  EINVERSTAENDNIS
  SONSTIGES
}

model Reminder {
  id        String   @id @default(cuid())
  eventId   String
  type      ReminderType
  sentAt    DateTime?
  scheduledFor DateTime
}

enum ReminderType {
  H24   // 24 Stunden vorher
  H2    // 2 Stunden vorher
  CUSTOM
}

model Message {
  id         String      @id @default(cuid())
  tenantId   String
  teamId     String?
  senderId   String
  content    String
  type       MessageType
  silentFrom String?     // Stille-Stunden Start (z.B. "22:00")
  silentTo   String?     // Stille-Stunden Ende (z.B. "07:00")
  createdAt  DateTime    @default(now())
  reads      MessageRead[]
}

enum MessageType {
  BROADCAST      // Trainer → Mannschaft
  ANNOUNCEMENT   // Vorstand → alle Mitglieder
  TEAM_CHAT      // Team-Chat (opt-in)
  QUESTION       // Eltern-Frage
  FAQ_ANSWER     // Automatische KI-Antwort
}

model FAQ {
  id        String @id @default(cuid())
  tenantId  String
  teamId    String?
  question  String
  answer    String
  useCount  Int    @default(0) // Wie oft wurde automatisch beantwortet
}
```

---

## 🚀 Sprint-Plan

### Sprint 1 (Woche 1-2): Infrastruktur & Auth
- Turborepo Monorepo Setup
- Docker + Docker Compose
- PostgreSQL + Prisma + Multi-Tenant Schema
- NestJS Backend Grundstruktur
- JWT Auth (Login, Register, Refresh Token)
- Tenant Registration Endpoint
- Swagger API Docs

### Sprint 2 (Woche 3-4): Mitgliederverwaltung
- Mitgliedsantrag (Selbstanmeldung + Trainer-Einladung)
- Profilverwaltung
- Digitaler Mitgliedsausweis (QR-Code)
- E-Mail Einladungsflow mit Erinnerungen (Brevo)
- Formular-Upload & Konvertierung (PDF/DOCX → Digital)
- Digitale Unterschrift

### Sprint 3 (Woche 5-6): Teams & Kalender
- Mannschaftsverwaltung (nach Sportart + Altersklasse)
- Training/Events planen
- An-/Abmeldung mit Pflichtfeld "Grund"
- Automatische Erinnerungen (24h + 2h vorher mit Maps-Link)
- Hallen-Pinwand (Name, Adresse, Google Maps)
- Anwesenheitsliste digital

### Sprint 4 (Woche 7-8): Turnier-Manager (USP!)
- Spielplan erstellen (Gruppe, KO, Schweizer System)
- Livescoring
- Public-URL für Leinwand (WebSocket live update)
- QR-Code für Eltern
- Tabellenberechnung automatisch

### Sprint 5 (Woche 9-10): Messaging (WhatsApp-Ersatz)
- Broadcast: Trainer → Mannschaft (Push + E-Mail)
- Antwort-Buttons: ✅ / ❌ / ❓
- Eltern-Kanal (strukturiert, kein Chaos)
- Stille-Stunden-Schutz (keine Pushes nachts)
- KI-FAQ-System (automatische Antworten)
- Notfall-Broadcast per SMS

### Sprint 6 (Woche 11-12): Mobile App
- Expo Setup (iOS + Android)
- Login, Push Notifications
- Kalender + An-/Abmeldung
- Turnier-Live-Anzeige

### Sprint 7 (Woche 13-14): White-Label & Branding
- Logo-Upload pro Verein
- Primärfarbe wählbar
- Subdomain-Routing (fckunchen.vereinbase.de)
- Optionale eigene Domain

### Beta-Launch Woche 15
- 2-3 Pilotvereine aus dem Filstal
- Kostenlos onboarden, Feedback sammeln

---

## 📋 Wichtige Regeln — immer beachten

### Code-Qualität
- **Alle UI-Texte und Kommentare auf DEUTSCH**
- **TypeScript strict mode** — kein `any`
- **Environment Variables** für alle Secrets — nie hardcoden
- **Error Handling** überall mit sinnvollen deutschen Fehlermeldungen

### DSGVO & Sicherheit
- **Nur EU-Server** (Hetzner Deutschland/Finnland)
- **Row-Level Security** in PostgreSQL
- **Schema-per-Tenant** für vollständige Datentrennung
- **Keine US-Dienste** ohne Einwilligung
- **Passwörter** nur mit bcrypt (min. 12 rounds)
- **Logs** keine personenbezogenen Daten

### Multi-Tenant
- Jede Datenbankabfrage MUSS `tenantId` als Filter haben
- Middleware prüft Tenant-Zugehörigkeit bei jedem Request
- Superadmin kann alle Tenants sehen

### Formular-System
- Vereine können eigene Anmeldeformulare hochladen (PDF/DOCX)
- System erkennt Felder automatisch (KI-gestützt)
- Konvertierung zu digitalem Formular das per E-Mail versendbar ist
- Mitglied kann online ausfüllen + digital unterschreiben
- Automatische Erinnerungen bis Formular ausgefüllt ist
- PDF-Archivierung nach Abschluss

### Messaging-Regeln
- Eltern können KEINE freien Nachrichten senden (nur strukturiert)
- Stille-Stunden: keine Push-Notifications zwischen 22:00-07:00
- Ausnahme: Notfall-Broadcast (Trainer muss explizit bestätigen)
- Trainer sieht Lesestatus pro Empfänger

---

## 🌍 Deployment (Hetzner)

```yaml
# Server: Hetzner CX22 Ubuntu 24.04
# IP: [deine-server-ip]
# Domain: vereinbase.de (geplant)

# Wichtige Ports:
# 80/443: Traefik (Web)
# 5432: PostgreSQL (nur intern)
# 6379: Redis (nur intern)
```

---

## 📦 Aktueller Status (Stand: 20.03.2026)

**ALLE Features implementiert. Nur Infrastruktur (DNS, Docker, Mobile) offen.**

### 90+ Backend-Module:
- [x] Auth (JWT, Refresh, 2FA/TOTP, Google OAuth, Passwort-Reset, E-Mail-Verifizierung)
- [x] Multi-Tenant (Schema-per-Tenant, RLS auf 35 Tabellen, mitTenant() Extension)
- [x] Superadmin (/admin: Vereine listen/sperren/entsperren/Plan/Impersonation)
- [x] KI-Freischaltung pro Verein (Plattform-Keys per Web-UI, Anthropic + OpenAI)
- [x] Sperr-Middleware + Sperrseite (Auto-Sperre nach 3 Stripe-Fehlschlaegen)
- [x] Mitgliederverwaltung (E-Mail, Multi-Sport, QR-Ausweis, DSGVO-Export Art.15+20)
- [x] Abteilungen + Berichte + Teams + Kader
- [x] Kalender/Events + Erinnerungen (24h + 2h) + Wiederholungen
- [x] QR-Code Schnell-Check-In (Token-basiert, 4h gueltig, /checkin/[token])
- [x] Geburtstags-Benachrichtigung (BullMQ CronJob 08:00, Push an Trainer)
- [x] Turnier-Manager + Livescoring + Public-URL + Landingpages
- [x] Event-Landingpages (/event/[slug] - oeffentliche Werbeseiten)
- [x] Nachrichten + Notfall-Broadcast + Stille-Stunden
- [x] Einladungs-System (Multi-Formular, Wizard, Unterschrift)
- [x] Formulare (PDF-Upload + KI-Felderkennung)
- [x] KI-FAQ-System + Multi-KI-Provider (Claude/OpenAI pro Verein)
- [x] BullMQ Job-Queue (E-Mail, Erinnerungen, Push, Geburtstag async via Redis)
- [x] Socket.io Realtime (Turnier-Live, Team-Chat)
- [x] Web Push Notifications (VAPID, Service Worker, Stille-Stunden)
- [x] IMAP E-Mail-Empfang (ImapFlow, 5min Polling, Tenant + User-Level)
- [x] iCal Calendar Feed (Google Calendar, Apple, Outlook Abo)
- [x] Hallenbelegung, Schiedsrichter, Buchhaltung/SEPA, Sponsoren
- [x] DFBnet Import/Export, Dokumenten-Ablage, Fahrtenboerse
- [x] Eltern-Portal, Ressourcen & Platzbuchung
- [x] KI-Trainingsplan-Generator, Aufstellungsplaner
- [x] Verletzungsprotokoll (DSGVO Art.9), Spieler-Entwicklungsbogen
- [x] Affiliate-Programm, Vereinshomepage-System (dnd-kit Editor)
- [x] Taeglich DB-Backup (Cron 3:00, 30 Tage + monatlich, Pro-Verein-Export)
- [x] Tenant-Isolations-Tests (594 Zeilen, 9 Kategorien)
- [x] Rate Limiting, Sentry, Prisma Migrations, Profilbild-Upload
- [x] Subdomain-Routing (Code fertig: middleware.ts Frontend + Backend)
- [x] PM2 Prozess-Management (ecosystem.config.js, Auto-Restart, systemd Setup-Script)
- [x] Docker-Setup (Dockerfiles + docker-compose.prod.yml + standalone Next.js)
- [x] Mitglieder-Selbstverwaltung (Aenderungsantraege mit Genehmigung)
- [x] Eltern-Umfragen / Doodle-Ersatz (Token-basiert, oeffentlich)
- [x] Digitales Schwarzes Brett (Kategorien, Push bei AUSFALL, oeffentlich)
- [x] Wartelisten-Management (maxKader, Auto-Einladung, 48h-Frist)
- [x] Familie-Verknuepfung (Partner, Kinder, Geschwister - Mama+Papa synchronisiert)
- [x] Vereinbase Marktplatz (vereinsuebergreifend, PLZ-Filter, Bewerbungen)
- [x] Geburtstags-E-Mail an Mitglieder (HTML mit Logo)
- [x] Eltern-Einverstaendnis digital (Token-basiert, Unterschrift)
- [x] Foto-Galerie pro Team/Event (Upload, Lightbox, Grid)
- [x] Vereins-Wiki (internes Wissensmanagement, Suche, Kategorien)
- [x] Saisonplanung (visuelle Timeline, Phasen, Auto-Events)
- [x] Jahres-Statistik-Poster (PDF, Vereinsfarbe, Social Media)
- [x] Sponsoren-Portal (Magic-Link Login, Dashboard)
- [x] Impressum, Datenschutz, AGB, AVV Seiten (vollstaendige Rechtstexte)
- [x] Mitglied-Dokumente (Papierantraege scannen/fotografieren, Mitglied zuordnen)
- [x] Foto-/Fahrgemeinschaft-Einverstaendnis (Checkboxen bei Minderjaehrigen, KUG §22 + §832 BGB)
- [x] Galerie DSGVO-Filterung (nur eigene Team-Fotos sichtbar)
- [x] Multi-Upload mit Fortschrittsbalken (Galerie + Team-Fotos + Dokumente)
- [x] Audit-Log + System-Status (Admin)
- [x] NDA/Vertrags-System (Token-basiert, Unterschrift, IP-Log)
- [x] Eltern-Einverstaendnis digital (Token-basiert, pro Event)
- [x] Foto-Galerie pro Team/Event (Upload, Lightbox)
- [x] Vereins-Wiki (Wissensmanagement, Suche, Kategorien)
- [x] Saisonplanung (Timeline, Phasen, Auto-Events)
- [x] Jahres-Statistik-Poster (PDF, Vereinsfarbe)
- [x] Sponsoren-Portal (Magic-Link Login, Dashboard)
- [x] Vereins-Gesundheitscheck (Score 0-100, 4 Kategorien)
- [x] Vereins-Crowdfunding (Spenden, Fortschrittsbalken)
- [x] Versicherungs-Check (Empfehlungen, Warnungen)
- [x] Trainer-Lizenzen-Tracker (Ablauf-Warnung)
- [x] Foerdermittel-Jahresbericht (PDF mit pdfkit)
- [x] Ehrenamt-Modul (Helfer-Aufgaben, Uebungsleiter 3.300 EUR)
- [x] Vereinsfest-Planer (Schichten, Einkauf, Kasse)

### 65+ Frontend-Seiten:
Dashboard, Mitglieder (+Detail, +Entwicklung), Mitarbeiter,
Abteilungen, Teams (+Detail, +Anwesenheit, +Kasse, +Trikots, +Aufstellung),
Kalender (+Detail, +Landingpage-Editor, +WetterBadge, +QR-Check-In),
Turniere (+Detail, +Landingpage), Nachrichten, Fahrgemeinschaften,
Eltern-Portal, Posteingang (IMAP), Belegung, Schiedsrichter, Buchhaltung,
Sponsoren, Workflows, Formulare (+Detail), Dokumente, DFBnet, Ressourcen,
Trainingsplaene, Spielberichte,
Einstellungen (Verein, Vereinsdaten, Sportbetrieb [Abteilungen, Teams, Sportarten,
Altersklassen, Veranstaltungstypen, Sportstaetten, Kalender-Farben, Kalender-Abo],
Rollen, Benutzer, Sicherheit [2FA], E-Mail, Homepage-Editor [dnd-kit],
Empfehlen, Abonnement, Beitraege),
Oeffentlich: /verein/[slug], /verein/[slug]/kalender, /turnier/[publicUrl],
/event/[slug] (Werbeseite), /aufstellung/[id], /checkin/[token],
Mein Profil (Selbstverwaltung), Umfragen (Doodle-Ersatz), Schwarzes Brett,
Aenderungsantraege (Admin),
Oeffentlich: /avv (Auftragsverarbeitungsvertrag),
Auth: Login, Registrierung, Passwort-Vergessen, E-Mail-Verifizierung, Onboarding,
Admin: /admin Dashboard (Superadmin, KI-Verwaltung, Plattform-Keys),
Oeffentlich: /umfrage/[token], /verein/[slug]/aktuell (Schwarzes Brett)

---

## 🚨 Feature-Roadmap (Stand: 21.03.2026)

### SOFORT (Diese Woche)
- [x] Passwort aus CLAUDE.md entfernt (Sicherheit)
- [x] Umlaute in 100+ UI-Strings korrigiert
- [x] DNS auf vereinbase.de (nginx extern in Docker)
- [x] Alle ClubOS-Referenzen zu Vereinbase umbenannt (Code komplett, nur DB-Name offen)
- [x] Login-E-Mails auf @vereinbase.de
- [ ] DB umbenennen: clubos_dev -> vereinbase_dev (sudo bash scripts/db-umbenennen.sh)
- [ ] NocoDB mit PostgreSQL verbinden
- [ ] Stripe Billing fertigstellen (Checkout, Webhook, PlanGuard)

### Phase A — Schnell umsetzbar, hohe Wirkung
- [x] A1: Geburtstags-Benachrichtigung (BullMQ CronJob 08:00, Push an Trainer)
- [x] A2: QR-Code Schnell-Check-In (Token 4h, /checkin/[token], QR-Dialog)
- [x] A3: Mitglieder-Selbstverwaltung (MemberAenderungsantrag, Genehmigung durch Vorstand)
- [x] A4: Eltern-Umfragen / Doodle-Ersatz (Schnellumfrage, Token-basiert, oeffentlich)
- [x] A5: Digitales Schwarzes Brett (/verein/[slug]/aktuell, Kategorien, Push bei AUSFALL)
- [x] A6: Wartelisten-Management (maxKader, Auto-Einladung, 48h-Frist, BullMQ stuendlich)

### Phase B — Mittlerer Aufwand, strategisch wichtig
- [x] B1: Foerdermittel-Jahresbericht (PDF-Export, Mitgliederentwicklung, Altersstruktur)
- [x] B2: Ehrenamt-Modul (Helfer-Aufgaben, Uebungsleiterstunden, 3.300 EUR Warnung)
- [x] B3: Vereinsfest-Planer (Schichten, Einkaufsliste, Kassen-Abrechnung)
- [x] B4: KI-Mitgliederbindung (Risiko-Score 0-100, Ampel, KI-Kontaktvorschlag, Weekly CronJob)

### Phase C — Vereinbase als Plattform (KOMPLETT)
- [x] C1: Vereinbase Marktplatz (vereinsuebergreifend, PLZ-Filter, Bewerbungen)
- [x] C2: Vereins-Gesundheitscheck Dashboard (Score 0-100, 4 Kategorien, Empfehlungen)
- [x] C3: iCal Feed (/homepage/ical/:slug)
- [x] C4: Vereins-Crowdfunding (Fortschrittsbalken, oeffentliche Projektseite, Spenden)
- [x] C5: Regionaler Schiedsrichter-Pool (im Marktplatz integriert)

### Phase D — (KOMPLETT, D1 gestrichen)
- [x] D2: Vereins-Versicherungs-Check (Empfehlungen, Warnungen, Prioritaeten)
- [x] D3: Trainer-Qualifizierungs-Tracker (Lizenzen, Ablauf-Warnung)
- [ ] D4: Mobile App (Expo React Native)
- [x] D5: Vereins-Statistik-Seite oeffentlich (/verein/[slug]/statistiken)

### Infrastruktur
- [x] DNS: vereinbase.de (A-Record + SSL via Caddy)
- [ ] Wildcard-Subdomains (Caddy schon konfiguriert)
- [ ] Eigene Domain pro Verein (CNAME)

### KI als Premium-Addon
- [x] PlattformConfig (Superadmin setzt Keys per Web-UI)
- [x] KI-Freischaltung pro Verein (Toggle im Admin-Dashboard)
- [x] Fallback: Verein-Key > Plattform-Key > .env
- [ ] KI-Nutzungsstatistik + Limits pro Plan
- [ ] KI-Kosten-Tracking

### Deployment (aktuell):
- Server: Ubuntu VM (192.168.0.151)
- nginx: Extern in Docker, leitet vereinbase.de auf Port 3000
- Frontend: PM2 (vereinbase-frontend, Port 3000)
- Backend: PM2 (vereinbase-backend, Port 3001)
- Domain: vereinbase.de
- DB: PostgreSQL (aktuell clubos_dev, Umbenennung mit sudo)
- DB-Backup: Cron taeglich 3:00 Uhr
- Frontend .env.local: NEXT_PUBLIC_API_URL=http://localhost:3001

---

## 🔑 Test-Zugangsdaten (Entwicklung)

```
Siehe .env und Seed-Daten. Passwoerter NICHT im Repository speichern!

Rollen:      SUPERADMIN, ADMIN, TRAINER, MEMBER, PARENT
Testdaten:   npx prisma db seed --schema=apps/backend/prisma/schema.prisma
```
