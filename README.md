# Vereinbase — Die Plattform fuer Sportvereine

Multi-Tenant SaaS-Plattform die WhatsApp-Gruppen, Spielerplus, easyVerein und Turnierheld ersetzt — alles in einer App, DSGVO-konform, deutscher Server.

**Stand: 24.03.2026 — 90+ Backend-Module, 65+ Frontend-Seiten**

---

## Features

### Kernfunktionen
- **Mitgliederverwaltung** — Anlegen, Status, Geburtsdatum, Eintrittsdatum, QR-Mitgliedsausweis, DSGVO-Export (Art. 15+20)
- **Mannschaften** — Teams nach Sportart und Altersklasse, Kader, Wartelisten-Management
- **Abteilungen** — Abteilung = Sportart, automatische Team-Zuordnung
- **Kalender** — Training, Spiele, Turniere, Wiederholungen, An-/Abmeldung mit Pflichtgrund, QR-Check-In
- **Turnier-Manager** — Spielplan (Gruppe/KO/Schweizer), Livescoring, oeffentliche Anzeigetafel (WebSocket), Landingpages
- **Nachrichten** — Broadcast, Eltern-Kanal, Stille-Stunden (22-07 Uhr), Notfall-Broadcast
- **Pinnwand & Galerie** — Digitales Schwarzes Brett, Foto-Galerie (DSGVO-gefiltert), Fahrtenboerse

### Vereinsrollen-System
- **Mehrere Rollen pro Benutzer** — Vorstand, Trainer, Kassenprufer, Ehrenamt, Spieler, Jugendspieler, Eltern, Innendienst
- **8 Standard-Rollenvorlagen** — Automatisch bei Registrierung, Berechtigungen pro Rolle anpassbar
- **Granulare Berechtigungen** — BerechtigungenGuard auf allen Modulen, Sidebar-Filterung
- **Auto-Ableitung** — Vereins-Rolle bestimmt Team-Rolle (Eltern→ELTERN, Trainer→TRAINER)

### Trainer-Features
- **Anwesenheitsstatistik** — Heatmap-Tabelle, Ampel-System, automatische Fehl-Alerts
- **Spielbericht + KI-Text** — Wizard fuer Ergebnis/Torschuetzen/Karten, KI generiert Pressetext
- **Mannschaftskasse** — Strafenkatalog, Einzahlungen, Saldo pro Mitglied
- **Trikotverwaltung** — Ausgabe, Rueckgabe, Ausstehende uebersichtlich
- **Aufstellungsplaner** — Formation-Selector, CSS-Grid Spielfeld, oeffentliche URL zum Teilen
- **KI-Trainingsplan** — Fokus beschreiben, KI erstellt strukturierte Einheiten
- **Verletzungsprotokoll** — RehaStatus-Tracking, DSGVO Art.9 konform
- **Spieler-Entwicklungsbogen** — Sternebewertung (1-5), Radar-Chart, Trend-Vergleich

### Vereinsverwaltung
- **Belegung** — Hallen + Sportplaetze Wochenplan
- **Ressourcen & Platzbuchung** — Plaetze, Raeume, Equipment buchbar mit Konflikt-Pruefung
- **Buchhaltung/SEPA** — Rechnungen, Beitraege, DATEV-Export, Beitragsklassen
- **Dokumenten-Ablage** — Upload, Verwaltung, Mitglied-Dokumente (Papier scannen)
- **Formulare** — PDF-Upload + KI-Felderkennung (alle Seiten, 30k Zeichen), digitale Unterschrift
- **DFBnet Import/Export** — CSV Schnittstelle
- **Sponsoren-Modul** — Sponsorenverwaltung, Crowdfunding, Sponsoren-Portal (Magic-Link)
- **Schiedsrichter** — Verwaltung und Einsatzplanung
- **Workflows** — Multi-PDF Einladungs-Workflows mit Schritt-Reihenfolge

### Familie & Eltern
- **Familie-Verknuepfung** — Partner, Kinder, Geschwister (automatisch synchronisiert)
- **Eltern-Portal** — Kinder, Teams, Abteilungen einsehen
- **Eltern-Automatik** — Kind ins Team → Eltern automatisch drin + Sportarten uebernommen
- **Eltern-Einverstaendnis** — Digital (Token-basiert, pro Event, Unterschrift)
- **Foto-/Fahrgemeinschaft-Einverstaendnis** — Checkboxen bei Minderjaehrigen (KUG §22 + §832 BGB)
- **Eltern-Umfragen** — Doodle-Ersatz (Token-basiert, oeffentlich)

### Kommunikation
- **Fahrtenboerse** — Fahrgemeinschaften organisieren
- **IMAP Posteingang** — E-Mail-Empfang (ImapFlow, 5min Polling, pro User konfigurierbar)
- **iCal Feed** — Google Calendar, Apple, Outlook Abo
- **Web Push Notifications** — VAPID, Service Worker, Stille-Stunden-Schutz
- **Wetter-Integration** — Open-Meteo API, WetterBadge im Kalender (kostenlos, DSGVO-konform)
- **Geburtstags-Benachrichtigung** — BullMQ CronJob 08:00, Push + E-Mail an Trainer und Mitglied

### KI-Features
- **Multi-KI-Provider** — Claude (Anthropic) + OpenAI, pro Verein konfigurierbar
- **KI-FAQ-System** — Automatische Antworten auf Eltern-Fragen
- **KI-Spielbericht** — Pressetext aus Ergebnis + Torschuetzen generieren
- **KI-Trainingsplan** — Strukturierte Einheiten aus Fokus-Beschreibung
- **KI-PDF-Scan** — Alle Seiten (30k Zeichen, Seitenmarkierungen) fuer Formular-Erkennung
- **KI-Mitgliederbindung** — Risiko-Score 0-100, Ampel, Kontaktvorschlag (Weekly CronJob)
- **Plattform-Keys per Web-UI** — Anthropic + OpenAI, Freischaltung pro Verein (Toggle im Admin)

### Berichte & Qualitaet
- **Vereins-Gesundheitscheck** — Score 0-100, 4 Kategorien, Empfehlungen
- **Mitgliederbindung** — Risiko-Score, Ampel, KI-Kontaktvorschlag
- **Trainer-Lizenzen-Tracker** — Ablauf-Warnung
- **Versicherungs-Check** — Empfehlungen, Warnungen, Prioritaeten
- **Foerdermittel-Jahresbericht** — PDF-Export mit pdfkit
- **Jahres-Statistik-Poster** — PDF, Vereinsfarbe, Social Media

### Plattform & Verwaltung
- **Multi-Tenant** — Jeder Verein hat eigene Daten, Farben, Logo
- **White-Label** — Vereinsfarbe, Logo, Subdomain-Routing (code fertig)
- **Affiliate-Programm** — Empfehlungscodes, Gratismonate fuer beide Seiten
- **Vereinbase Marktplatz** — Vereinsuebergreifend, PLZ-Filter, Bewerbungen
- **Kooperationspartner** — Plattform-Level (SUPERADMIN), 9 Kategorien, Provision + Rabatt
- **Vereins-Partner/Dienstleister** — Tenant-Level, Auftrags-Tracking, Notizen
- **Vereinshomepage-System** — dnd-kit Editor, oeffentliche Seiten
- **Vereins-Wiki** — Internes Wissensmanagement, Suche, Kategorien
- **Saisonplanung** — Visuelle Timeline, Phasen, Auto-Events
- **Vereinsfest-Planer** — Schichten, Einkaufsliste, Kassen-Abrechnung
- **Ehrenamt-Modul** — Helfer-Aufgaben, Uebungsleiterstunden (3.300 EUR Warnung)
- **Wartelisten-Management** — maxKader, Auto-Einladung, 48h-Frist
- **Mitglieder-Selbstverwaltung** — Aenderungsantraege mit Genehmigung
- **NDA/Vertrags-System** — Token-basiert, Unterschrift, IP-Log
- **Audit-Log + System-Status** — Admin-Bereich

### Superadmin
- **Admin-Dashboard** — Vereine listen/sperren/entsperren/loeschen/Plan aendern
- **Impersonation** — Als Verein einloggen (Fernwartung)
- **KI-Verwaltung** — Plattform-Keys setzen, pro Verein freischalten
- **Sperr-Middleware** — Auto-Sperre nach 3 Stripe-Fehlschlaegen, Sperrseite

### Sicherheit & DSGVO
- **2FA/TOTP** — Authenticator-App + Backup-Codes
- **E-Mail-Verifizierung** — Per SMTP (24h Token)
- **Passwort-Reset** — Token-basiert (1h)
- **Rate Limiting** — Login 5/min, Registrierung 3/min, Passwort-Reset 3/min
- **CSP-Header** — Content-Security-Policy + Permissions-Policy + HSTS preload
- **CORS eingeschraenkt** — api.vereinbase.de nur von vereinbase.de
- **Row-Level Security** — Auf 35 Tabellen, mitTenant() Extension
- **Sentry Error-Monitoring** — Backend + Frontend (optional)
- **DB-Backup** — Taeglich 3:00 Uhr, 30 Tage + monatlich, Pro-Verein-Export
- **Tenant-Isolations-Tests** — 594 Zeilen, 9 Kategorien
- **Offline-Indikator** — Rotes Banner bei Verbindungsverlust

### Rechtstexte (vollstaendig)
- Impressum, Datenschutzerklaerung, AGB, AVV (Auftragsverarbeitungsvertrag)

---

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Backend | NestJS, TypeScript, Prisma, PostgreSQL |
| Frontend | Next.js 14, shadcn/ui, Tailwind CSS, Zustand |
| Auth | JWT + Refresh Tokens + 2FA/TOTP + Google OAuth |
| Queue | BullMQ + Redis |
| Realtime | Socket.io (Turnier-Live, Team-Chat) |
| KI | Anthropic Claude + OpenAI (waehlbar pro Verein) |
| Charts | Recharts (Radar-Chart, Statistiken) |
| Wetter | Open-Meteo API (kostenlos, kein Key) |
| Push | Web Push (VAPID) + Service Worker |
| E-Mail | SMTP (Strato) + IMAP-Poller (ImapFlow) |
| Monitoring | Sentry (optional) |
| Monorepo | npm Workspaces + Turborepo |
| Deployment | PM2 + nginx (Docker) auf Ubuntu VM |

---

## Installation

### Voraussetzung
- Linux Ubuntu/Debian (oder macOS)
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Automatisches Setup (empfohlen)

```bash
git clone https://github.com/Tschatscher85/Vereinbase.git
cd Vereinbase

# Installiert PostgreSQL, Redis, richtet DB ein, seedet Testdaten
sudo bash setup.sh

# Starten
bash start.sh
```

### Manuelles Setup

```bash
# Dependencies installieren
npm install

# Shared Package bauen
npm run build --workspace=packages/shared

# Prisma Client generieren
npx prisma generate --schema=apps/backend/prisma/schema.prisma

# .env erstellen und anpassen
cp apps/backend/.env.example apps/backend/.env

# Datenbank-Migrations anwenden (PostgreSQL muss laufen)
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma

# Testdaten einfuegen
cd apps/backend && npx ts-node prisma/seed.ts && cd ../..

# Backend starten (Terminal 1)
npm run dev --workspace=apps/backend

# Frontend starten (Terminal 2)
npm run dev --workspace=apps/frontend
```

### Produktions-Build

```bash
# Frontend bauen (standalone)
npx turbo build --filter=@vereinbase/frontend

# Mit PM2 starten
pm2 start ecosystem.config.js
```

### Zugriff von anderem Rechner

```bash
# API-URL auf Server-IP setzen
echo 'NEXT_PUBLIC_API_URL=http://<SERVER-IP>:3001' > apps/frontend/.env.local

# Frontend neu bauen + starten
npx turbo build --filter=@vereinbase/frontend
pm2 restart vereinbase-frontend
```

### Sentry einrichten (optional)

```bash
# Backend .env:
SENTRY_DSN_BACKEND=https://xxx@sentry.io/xxx

# Frontend .env.local:
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## URLs

| Was | URL |
|-----|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger API-Docs | http://localhost:3001/api/docs |
| Turnier Live-Ansicht | http://localhost:3000/turnier/{publicUrl} |
| Aufstellung oeffentlich | http://localhost:3000/aufstellung/{id} |
| QR-Check-In | http://localhost:3000/checkin/{token} |
| Event-Landingpage | http://localhost:3000/event/{slug} |
| Vereins-Homepage | http://localhost:3000/verein/{slug} |
| Schwarzes Brett | http://localhost:3000/verein/{slug}/aktuell |
| Umfrage (oeffentlich) | http://localhost:3000/umfrage/{token} |

---

## Test-Zugangsdaten

Test-Zugangsdaten: Siehe `apps/backend/prisma/seed.ts` und lokal konfigurieren.

| Rolle | E-Mail | Vereinsrollen |
|-------|--------|---------------|
| Superadmin | admin@vereinbase.de | — |
| Admin | vorstand@vereinbase.de | Vorstand |
| Trainer | trainer@vereinbase.de | Trainer |
| Mitglied | spieler@vereinbase.de | Spieler |
| Elternteil | eltern@vereinbase.de | Eltern |

Tenant: **FC Kunchen 1920 e.V.** (Slug: fckunchen)

---

## Projektstruktur

```
vereinbase/
├── apps/
│   ├── backend/               # NestJS API (Port 3001)
│   │   ├── prisma/            # Schema, Migrations, Seed
│   │   └── src/
│   │       ├── auth/          # JWT, 2FA/TOTP, OAuth, Passwort-Reset
│   │       ├── member/        # Mitgliederverwaltung
│   │       ├── team/          # Mannschaften + Anwesenheit
│   │       ├── event/         # Kalender/Veranstaltungen + Erinnerungen
│   │       ├── tournament/    # Turnier-Manager + Livescoring
│   │       ├── kasse/         # Mannschaftskasse + Strafenkatalog
│   │       ├── trikot/        # Trikotverwaltung
│   │       ├── aufstellung/   # Aufstellungsplaner
│   │       ├── spielbericht/  # Spielberichte + KI-Text
│   │       ├── trainingsplan/ # KI-Trainingsplan
│   │       ├── verletzung/    # Verletzungsprotokoll
│   │       ├── entwicklung/   # Spieler-Entwicklungsbogen
│   │       ├── buchung/       # Ressourcen & Platzbuchung
│   │       ├── wetter/        # Wetter-Integration
│   │       ├── abteilung/     # Abteilungsverwaltung
│   │       ├── rollen-vorlage/ # Vereinsrollen-Vorlagen (8 Standard)
│   │       ├── referral/      # Affiliate-Programm
│   │       ├── user/          # Benutzerverwaltung
│   │       ├── tenant/        # Vereinsverwaltung
│   │       ├── message/       # Nachrichten + Notfall-Broadcast
│   │       ├── ki/            # KI-Service (Claude + OpenAI)
│   │       ├── queue/         # BullMQ Jobs (Mail, Push, Erinnerungen)
│   │       ├── realtime/      # Socket.io (Turnier, Chat)
│   │       ├── push/          # Web Push Notifications (VAPID)
│   │       ├── einladung/     # Einladungs-System + Mail-Service
│   │       ├── dokument/      # Dokumenten-Ablage
│   │       ├── formular/      # PDF-Upload + KI-Felderkennung
│   │       ├── galerie/       # Foto-Galerie (DSGVO-gefiltert)
│   │       ├── aushang/       # Digitales Schwarzes Brett
│   │       ├── umfrage/       # Eltern-Umfragen / Doodle-Ersatz
│   │       ├── warteliste/    # Wartelisten-Management
│   │       ├── familie/       # Familie-Verknuepfung
│   │       ├── marktplatz/    # Vereinbase Marktplatz
│   │       ├── ehrenamt/      # Ehrenamt-Modul
│   │       ├── vereinsfest/   # Vereinsfest-Planer
│   │       ├── wiki/          # Vereins-Wiki
│   │       ├── saisonplan/    # Saisonplanung
│   │       ├── sponsoren/     # Sponsoren + Crowdfunding
│   │       ├── homepage/      # Vereinshomepage-System
│   │       ├── admin/         # Superadmin-Dashboard
│   │       └── common/        # Guards, Filter, Decorators, Middleware
│   └── frontend/              # Next.js Web-App (Port 3000)
│       └── src/
│           ├── app/           # 65+ Seiten (App Router)
│           │   ├── (auth)/    # Login, Registrierung, Passwort-Reset
│           │   ├── (dashboard)/ # Dashboard-Layout mit Auth-Guard
│           │   └── (public)/  # Oeffentliche Seiten (kein Auth)
│           ├── components/    # UI-Komponenten (shadcn/ui)
│           ├── stores/        # Zustand State Management
│           ├── hooks/         # Custom Hooks (useAuth, useHatBerechtigung)
│           └── lib/           # API-Client, Theme, Constants
├── packages/
│   └── shared/                # Gemeinsame Types, Enums, Konstanten
├── setup.sh                   # Automatisches Linux-Setup
├── install.sh                 # Produktions-Installation (Docker + Traefik)
├── start.sh                   # Entwicklung: Backend + Frontend starten
├── ecosystem.config.js        # PM2 Prozess-Management
├── docker-compose.yml         # PostgreSQL + Redis (Entwicklung)
├── docker-compose.prod.yml    # Produktion mit Traefik SSL
├── CLAUDE.md                  # Projektkontext fuer Claude Code
├── INSTALL.md                 # Self-Hosting Anleitung
├── BETA-LAUNCH-CHECKLISTE.md  # Launch-Checkliste + Testanleitung
└── PROMPTS.md                 # Claude Code Prompt-Sammlung
```

---

## Sidebar-Navigation

```
Verein
  - Mitglieder & Mitarbeiter    [Tabs: Mitglieder | Mitarbeiter | Ehrenamt]
  - Teams & Abteilungen         [Tabs: Abteilungen | Teams]
Aktivitaeten
  - Kalender & Saison
  - Nachrichten & Umfragen
  - Pinnwand & Galerie          [Tabs: Pinnwand | Galerie | Fahrtenboerse]
Finanzen
  - Buchhaltung & Beitraege
  - Sponsoren & Crowdfunding    [Tabs: Sponsoren | Crowdfunding]
Verwaltung
  - Dokumente & Wiki            [Tabs: Dokumente | Formulare | Wiki]
  - Schiedsrichter
  - Marktplatz & Partner
Berichte & Qualitaet
  - Berichte
  - Mitgliederbindung
  - Gesundheitscheck
  - Trainer-Lizenzen
  - Versicherungs-Check
System
  - Einstellungen
  - Workflows
  - DFBnet Import/Export
  - Aenderungsantraege
Spezial
  - Eltern-Portal (nur PARENT)
  - Belegungsplan (nur HALLENWART)
  - Admin-Dashboard (nur SUPERADMIN)
```

---

## API-Endpunkte (Auswahl)

### Auth
- `POST /auth/registrieren` — Verein + Admin registrieren (+ 8 Rollenvorlagen automatisch)
- `POST /auth/anmelden` — Login (mit Berechtigungen + Vereinsrollen, 2FA-Support)
- `POST /auth/2fa/verifizieren` — 2FA TOTP/Backup-Code verifizieren
- `GET /auth/profil` — Eigenes Profil
- `POST /auth/google` — Google OAuth Login/Register
- `POST /auth/passwort-vergessen` — Passwort-Reset per E-Mail
- `GET /auth/email-verifizieren` — E-Mail-Verifizierung

### Mitglieder
- `GET /mitglieder` — Alle Mitglieder (mit Geburtsdatum, Eintrittsdatum, Familie)
- `POST /mitglieder` — Mitglied anlegen (E-Mail = Auto-Login)
- `POST /mitglieder/batch-freigeben` — Ausstehende freigeben
- `GET /mitglieder/:id/dsgvo-export` — DSGVO Art.15 Datenexport

### Teams
- `GET /teams/:id/anwesenheit?wochen=12` — Anwesenheitsstatistik
- `GET /teams/:id/warteliste` — Warteliste (maxKader, Auto-Einladung)

### Mannschaftskasse
- `GET /kasse/:teamId` — Kassenstand + Buchungen
- `POST /kasse/:teamId/strafe` — Strafe verhaengen
- `GET /kasse/:teamId/saldo` — Saldo pro Mitglied

### Vereinsrollen
- `GET /rollen-vorlagen` — Alle Rollenvorlagen des Vereins
- `PUT /benutzer/verwaltung/:id/vereinsrollen` — Rollen zuweisen (Auto-Ableitung)

### KI
- `POST /trainingsplaene/:teamId` — KI-Trainingsplan generieren
- `POST /spielberichte/:eventId` — Spielbericht + KI-Text
- `POST /ki/faq` — KI-FAQ Antwort

### Wetter
- `GET /wetter/event/:eventId` — Wetter fuer ein Event (Open-Meteo)

### Ressourcen
- `GET /buchungen?ressourceId&start&ende` — Buchungen im Zeitraum
- `POST /buchungen` — Neue Buchung (mit Konflikt-Pruefung)

### Affiliate
- `GET /referral/mein-code` — Empfehlungscode abrufen
- `POST /referral/einloesen` — Code einloesen (kein Login noetig)

### Oeffentlich (kein Auth)
- `GET /turnier/public/:url` — Turnier-Liveansicht
- `GET /homepage/public/:slug` — Vereinshomepage
- `GET /homepage/ical/:slug` — iCal Feed
- `GET /checkin/:token` — QR-Check-In

Vollstaendige API-Dokumentation: `http://localhost:3001/api/docs` (Swagger UI)

---

## Lizenz

Proprietaer. Alle Rechte vorbehalten.
