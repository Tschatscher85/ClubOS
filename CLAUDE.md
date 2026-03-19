# ClubOS — Projektkontext für Claude Code

## 🎯 Was wird gebaut
ClubOS ist eine Multi-Tenant SaaS-Plattform für Sportvereine in Deutschland.
Sie ersetzt WhatsApp-Gruppen, Spielerplus, easyVerein, Doodle, Google Sheets
und Turnierheld — alles in einer App, DSGVO-konform, mit deutschem Server.

**Kernversprechen an Vereine:**
"Kündigt alle 6 Apps. ClubOS ersetzt WhatsApp-Gruppen, Spielerplus, easyVerein
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
clubos/
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
- Subdomain-Routing (fckunchen.clubos.de)
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
# Domain: clubos.de (geplant)

# Wichtige Ports:
# 80/443: Traefik (Web)
# 5432: PostgreSQL (nur intern)
# 6379: Redis (nur intern)
```

---

## 📦 Aktueller Status (Stand: 18.03.2026)

**Alle Sprints abgeschlossen (außer Mobile App)**

### 48 Backend-Module:
- [x] Auth (JWT, Refresh, Passwort-Aenderung, Passwort-Reset, E-Mail-Verifizierung, Google OAuth)
- [x] Multi-Tenant (Schema-per-Tenant)
- [x] Mitgliederverwaltung (E-Mail, Multi-Sport, Auto-Login, QR-Ausweis)
- [x] Abteilungen + Berichte
- [x] Teams + Kader
- [x] Kalender/Events + Erinnerungen (24h + 2h)
- [x] Turnier-Manager + Livescoring + Public-URL
- [x] Nachrichten + Notfall-Broadcast
- [x] Einladungs-System (Multi-Formular, Wizard, Unterschrift)
- [x] Workflows (Einladungs-Pakete pro Sportart)
- [x] Formulare (PDF-Upload + KI-Felderkennung)
- [x] PDF-Export fuer Einreichungen
- [x] KI-FAQ-System (automatische Antworten)
- [x] Multi-KI-Provider (Claude + OpenAI, pro Verein konfigurierbar)
- [x] QR-Code Mitgliedsausweis
- [x] BullMQ Job-Queue (E-Mail, Erinnerungen async via Redis)
- [x] Socket.io Realtime (Turnier-Live, Team-Chat)
- [x] Hallenbelegung (Wochenplan)
- [x] Schiedsrichter-Einteilung (manuell + Auto-Rotation)
- [x] Buchhaltung/SEPA (Rechnungen, Beitraege, DATEV-Export)
- [x] Sponsoren-Modul
- [x] E-Mail pro Trainer/Vorstand (eigenes SMTP + Signatur)
- [x] DFBnet CSV Import/Export
- [x] Dokumenten-Ablage
- [x] Fahrtenboerse
- [x] Eltern-Portal (Kinder, Teams, Abteilungen)
- [x] Dashboard (Statistiken, Uebersicht)
- [x] Vereins-Branding (Logo, Farbe, Subdomain)
- [x] Health + Config
- [x] Self-Hosting (install.sh, Docker, Traefik)
- [x] Rate Limiting (Throttler: Auth-Endpoints strenger, global)
- [x] Profilbild-Upload (Upload, Abruf, Loeschen)
- [x] Vereinshomepage-System (Sektionen, oeffentliche URLs, auto-generiert)
- [x] Turnier-Landingpages (Werbung, Sponsoren, oeffentliche URLs)
- [x] Vereinsrollen-System (RollenVorlage pro Verein, mehrere Rollen pro User, Auto-Berechnung)
- [x] Berechtigungs-Guard (BerechtigungenGuard + Decorator auf Controllern)
- [x] Sentry Error-Monitoring (Backend + Frontend, DSGVO-konform)
- [x] Prisma Migrations (statt db push, sicher fuer Produktion)
- [x] Anwesenheitsstatistik (Heatmap, Ampel-System, Fehl-Alerts)
- [x] Spielbericht + KI-Textgenerierung (Claude/OpenAI, Veroeffentlichen auf Homepage)
- [x] Mannschaftskasse + Strafenkatalog (Strafen, Einzahlungen, Saldo pro Mitglied)
- [x] Trikotverwaltung (Ausgabe, Rueckgabe, Ausstehende)
- [x] Wetter-Integration (Open-Meteo API, kostenlos, WetterBadge im Kalender)
- [x] Ressourcen & Platzbuchung (Konflikt-Pruefung, Wochenkalender)
- [x] KI-Trainingsplan-Generator (strukturierte Einheiten, Multi-KI-Provider)
- [x] Aufstellungsplaner (CSS-Grid Spielfeld, Formation-Selector, oeffentliche URL)
- [x] Verletzungsprotokoll (DSGVO Art.9, RehaStatus, nur Trainer/Admin)
- [x] Spieler-Entwicklungsbogen (Sternebewertung, Radar-Chart, Trend)
- [x] Affiliate & Empfehlungsprogramm (Referral-Codes, Gratismonate)

### 30+ Frontend-Seiten:
Dashboard, Mitglieder (+Detail, +Entwicklung), Mitarbeiter (Personaluebersicht),
Abteilungen, Teams (+Detail, +Anwesenheit, +Kasse, +Trikots, +Aufstellung),
Kalender (+Detail mit WetterBadge), Turniere (+Detail), Nachrichten,
Fahrgemeinschaften, Eltern-Portal, Belegung (Hallen+Sportplaetze),
Schiedsrichter, Buchhaltung, Sponsoren, Workflows, Formulare (+Detail),
Dokumente, DFBnet, Ressourcen (Buchungskalender), Trainingsplaene (KI-Generator),
Spielberichte (Wizard + KI-Text),
Einstellungen (Verein, Vereinsdaten, Sportarten, Beitraege, Rollen, Benutzer,
Empfehlen, KI, E-Mail, Passwort),
Einladung-Wizard, Registrierung (+Empfehlungscode), Passwort-Vergessen,
Passwort-Zuruecksetzen, E-Mail-Verifizierung, Onboarding-Wizard,
Aufstellung oeffentlich (kein Login)

### Erledigt (Stand: 19.03.2026):
- [x] Registrierungs-Seite (Frontend + Backend)
- [x] Passwort vergessen Flow (E-Mail anfordern + neues Passwort setzen)
- [x] Google OAuth (Backend + Frontend mit Google Sign-In Button)
- [x] E-Mail-Verifizierung (Token-basiert, automatisch bei Registrierung)
- [x] Passwort-Toggle (Auge-Icon) + Passwort-Staerke-Anzeige
- [x] Dark Mode (Toggle im Header, CSS-Variablen fuer Light/Dark)
- [x] Onboarding-Wizard (Logo, Farbe, Sportarten nach Registrierung)
- [x] Rate Limiting (Brute-Force-Schutz auf Auth-Endpoints)
- [x] Profilbild-Upload (API + Multer)
- [x] Vereinshomepage-System (Backend: Sektionen-basiert, auto-generiert)
- [x] Turnier-Landingpages (Backend: oeffentliche Werbeseiten fuer Turniere)
- [x] Vereinsrollen-System (Vorstand, Trainer, Kassenprufer, Ehrenamt, Spieler, Eltern, Innendienst)
- [x] Berechtigungs-Guard (granulare Berechtigung pro Modul, MEMBER/PARENT gefiltert)
- [x] Hallenbelegung umbenannt zu Belegung (Hallen + Sportplaetze)
- [x] Geburtsdatum-Spalte in Mitglieder-Tabelle
- [x] Einstellungen > Rollen (Rollenvorlagen pro Verein konfigurieren)
- [x] Einstellungen > Benutzer (Vereinsrollen zuweisen + individuelle Anpassung)
- [x] Sentry Error-Monitoring (Backend @sentry/nestjs + Frontend @sentry/nextjs)
- [x] Prisma Migrations (Baseline + migrate deploy statt db push)
- [x] Anwesenheitsstatistik (Teams > Anwesenheit: Heatmap + Ampel + Alerts)
- [x] Spielbericht + KI (Wizard: Ergebnis, Torschuetzen, Karten, KI-Text generieren)
- [x] Mannschaftskasse (Teams > Kasse: Strafen, Einzahlungen, Strafkatalog, Saldo)
- [x] Trikotverwaltung (Teams > Trikots: Ausgabe/Rueckgabe/Ausstehende)
- [x] Wetter-Integration (WetterBadge im Kalender-Event, Open-Meteo, 3h Cache)
- [x] Ressourcen & Platzbuchung (Wochenkalender, Konflikt-Pruefung)
- [x] KI-Trainingsplan-Generator (Einheiten-Wizard, Recharts nicht noetig)
- [x] Aufstellungsplaner (CSS-Grid, Formation-Selector, oeffentliche URL)
- [x] Verletzungsprotokoll (Team-Widget + Mitglied-Detail, DSGVO Art.9)
- [x] Spieler-Entwicklungsbogen (Radar-Chart mit Recharts, Sternebewertung)
- [x] Affiliate-Programm (Einstellungen > Empfehlen, Registrierung mit Code)
- [x] Sportarten 100% dynamisch (zentrale lib/sportarten.ts, API-Cache, alle 15+ Dateien migriert)
- [x] Einstellungen > Sportarten: Vorauswahl (20 Sportarten per Klick), leere bereinigen
- [x] Einstellungen > Kalender-Farben (Event-Typ-Farben konfigurierbar, localStorage)
- [x] Kalender: Belegungen im Monatskalender sichtbar (aus Wochenplan)
- [x] Event-Formular: Untergrund (Halle/Rasen/Kunstrasen), Wiederholung taegl./woechentl./monatl., Adresssuche OpenStreetMap, Orte aus Belegung
- [x] Abteilungen: Bearbeiten + Loeschen Buttons
- [x] Mitglied-Formular: Team-Zuordnung nach Abteilung gruppiert
- [x] Turniere-Tab: Zeigt anstehende Spiele + Button "Neues Spiel"

### Offen / Roadmap:
- [ ] Vereinskalender (oeffentlich fuer alle Mitglieder, teamuebergreifend, z.B. Sommerfest)
- [ ] Sichtbarkeit pro Mitglied (Backend-Filter: Mitglieder sehen nur Events ihrer Teams)
- [ ] Docker-Setup fuer Produktion (Dockerfile + docker-compose.prod.yml)
- [ ] Mobile App (Expo React Native) — kommt als letztes
- [ ] Vereinshomepage Frontend-Editor (Sektionen drag&drop, Vorschau)
- [ ] Turnier-Landingpage Frontend-Editor
- [ ] Vereinshomepage oeffentliche Darstellung (SSR-Seite fuer Besucher)
- [ ] 2-Faktor-Authentifizierung (TOTP)
- [ ] Push-Notifications (Web mit Service Worker)
- [ ] Subdomain-Routing (fckunchen.clubos.de → Vereinshomepage)

### Deployment (aktuell):
- Server: Hetzner Ubuntu VM (kein Docker)
- Frontend: `cd apps/frontend && npm run build && npx next start -p 3000`
- Backend: `cd apps/backend && npm run build && node dist/main.js`
- Prozesse laufen direkt mit Node, kein PM2/systemd aktuell

---

## 🔑 Test-Zugangsdaten (Entwicklung)

```
Passwort fuer alle: ClubOS2024!

Superadmin:  admin@clubos.de
Admin:       vorstand@fckunchen.de
Trainer:     trainer@fckunchen.de
Mitglied:    spieler@fckunchen.de
Elternteil:  eltern@fckunchen.de
```

Testdaten laden: `npx prisma db seed --schema=apps/backend/prisma/schema.prisma`

---

## 💡 Backlog (Zukunft)

- **KI-Trainer-Assistent:** "Erstelle mir einen Trainingsplan fuer die U12"
- **E-Rechnung (ZUGFeRD):** Automatische Rechnungserstellung
- **Subdomain-Routing:** fckunchen.clubos.de
- **Push-Notifications:** Firebase Cloud Messaging
