# Vereinbase — Die Plattform fuer Sportvereine

Multi-Tenant SaaS-Plattform die WhatsApp-Gruppen, Spielerplus, easyVerein und Turnierheld ersetzt — alles in einer App, DSGVO-konform, deutscher Server.

---

## Features (48 Backend-Module, 30+ Frontend-Seiten)

### Kernfunktionen
- **Mitgliederverwaltung** — Anlegen, Status, Geburtsdatum, Eintrittsdatum, QR-Mitgliedsausweis
- **Mannschaften** — Teams nach Sportart und Altersklasse, Kader
- **Kalender** — Training, Spiele, Turniere planen, An-/Abmeldung mit Pflichtgrund
- **Turnier-Manager** — Spielplan, Livescoring, oeffentliche Anzeigetafel (WebSocket)
- **Nachrichten** — Broadcast, Eltern-Kanal, Stille-Stunden, Notfall-SMS

### Vereinsrollen-System
- **Mehrere Rollen pro Benutzer** — Vorstand, Trainer, Kassenprufer, Ehrenamt, Spieler, Eltern, Innendienst
- **Konfigurierbare Rollenvorlagen** — Jeder Verein kann Berechtigungen pro Rolle anpassen
- **Granulare Berechtigungen** — BerechtigungenGuard auf allen Modulen, Sidebar-Filterung
- **Individuelle Anpassung** — Zusaetzliche Berechtigungen ueber Rollen hinaus

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
- **Buchhaltung/SEPA** — Rechnungen, Beitraege, DATEV-Export
- **Dokumenten-Ablage** — Upload und Verwaltung
- **Formulare** — PDF-Upload + KI-Felderkennung, digitale Unterschrift
- **DFBnet Import/Export** — CSV Schnittstelle
- **Sponsoren-Modul** — Sponsorenverwaltung

### Kommunikation
- **Fahrtenboerse** — Fahrgemeinschaften organisieren
- **Eltern-Portal** — Kinder, Teams, Abteilungen einsehen
- **Wetter-Integration** — Open-Meteo API, WetterBadge im Kalender (kostenlos, DSGVO-konform)

### KI-Features
- **Multi-KI-Provider** — Claude (Anthropic) + OpenAI, pro Verein konfigurierbar
- **KI-FAQ-System** — Automatische Antworten auf Eltern-Fragen
- **KI-Spielbericht** — Pressetext aus Ergebnis + Torschuetzen generieren
- **KI-Trainingsplan** — Strukturierte Einheiten aus Fokus-Beschreibung

### Plattform
- **Multi-Tenant** — Jeder Verein hat eigene Daten, Farben, Logo
- **White-Label** — Vereinsfarbe, Logo, Subdomain
- **Affiliate-Programm** — Empfehlungscodes, Gratismonate fuer beide Seiten
- **Sentry Error-Monitoring** — Backend + Frontend, DSGVO-konform
- **Self-Hosting** — install.sh, Docker, Traefik

---

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Backend | NestJS, TypeScript, Prisma, PostgreSQL |
| Frontend | Next.js 14, shadcn/ui, Tailwind CSS, Zustand |
| Auth | JWT + Refresh Tokens + Google OAuth |
| Queue | BullMQ + Redis |
| Realtime | Socket.io (Turnier-Live, Team-Chat) |
| KI | Anthropic Claude + OpenAI (waehlbar pro Verein) |
| Charts | Recharts (Radar-Chart, Statistiken) |
| Wetter | Open-Meteo API (kostenlos, kein Key) |
| Monitoring | Sentry (optional) |
| Monorepo | npm Workspaces + Turborepo |
| Deployment | Docker + Traefik (Hetzner DSGVO-konform) |

---

## Installation

### Voraussetzung
- Linux Ubuntu/Debian (oder macOS)
- Node.js 18+

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
# Frontend bauen
cd apps/frontend && npx next build

# Frontend starten (Produktion)
npx next start -p 3000

# Backend starten (Produktion)
cd apps/backend && npx nest start
```

### Zugriff von anderem Rechner

```bash
# API-URL auf Server-IP setzen
echo 'NEXT_PUBLIC_API_URL=http://<SERVER-IP>:3001' > apps/frontend/.env.local

# Frontend neu bauen + starten
cd apps/frontend && npx next build && npx next start -p 3000
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
| Aufstellung oeffentlich | http://localhost:3000/aufstellung/{url} |

---

## Test-Zugangsdaten

Test-Zugangsdaten: Siehe `apps/backend/prisma/seed.ts` und lokal konfigurieren.

| Rolle | E-Mail | Vereinsrollen |
|-------|--------|---------------|
| Superadmin | admin@vereinbase.de | — |
| Admin | vorstand@fckunchen.de | Vorstand |
| Trainer | trainer@fckunchen.de | Trainer |
| Mitglied | spieler@fckunchen.de | Spieler |
| Elternteil | eltern@fckunchen.de | Eltern |

---

## Projektstruktur

```
vereinbase/
├── apps/
│   ├── backend/               # NestJS API (Port 3001)
│   │   ├── prisma/            # Schema, Migrations, Seed
│   │   └── src/
│   │       ├── auth/          # JWT, OAuth, Passwort-Reset
│   │       ├── member/        # Mitgliederverwaltung
│   │       ├── team/          # Mannschaften + Anwesenheit
│   │       ├── event/         # Kalender/Veranstaltungen
│   │       ├── tournament/    # Turnier-Manager
│   │       ├── kasse/         # Mannschaftskasse + Strafenkatalog
│   │       ├── trikot/        # Trikotverwaltung
│   │       ├── aufstellung/   # Aufstellungsplaner
│   │       ├── spielbericht/  # Spielberichte + KI-Text
│   │       ├── trainingsplan/ # KI-Trainingsplan
│   │       ├── verletzung/    # Verletzungsprotokoll
│   │       ├── entwicklung/   # Spieler-Entwicklungsbogen
│   │       ├── buchung/       # Ressourcen & Platzbuchung
│   │       ├── wetter/        # Wetter-Integration
│   │       ├── rollen-vorlage/ # Vereinsrollen-Vorlagen
│   │       ├── referral/      # Affiliate-Programm
│   │       ├── user/          # Benutzerverwaltung
│   │       ├── tenant/        # Vereinsverwaltung
│   │       ├── message/       # Nachrichten
│   │       ├── ki/            # KI-Service (Claude + OpenAI)
│   │       ├── queue/         # BullMQ Jobs
│   │       ├── realtime/      # Socket.io
│   │       └── common/        # Guards, Filter, Decorators
│   └── frontend/              # Next.js Web-App (Port 3000)
│       └── src/
│           ├── app/           # Seiten (App Router)
│           ├── components/    # UI-Komponenten (shadcn/ui)
│           ├── stores/        # Zustand State Management
│           ├── hooks/         # Custom Hooks (useAuth, useHatBerechtigung)
│           └── lib/           # API-Client, Theme, Constants
├── packages/
│   └── shared/                # Gemeinsame Types, Enums, Konstanten
├── setup.sh                   # Automatisches Linux-Setup
├── install.sh                 # Produktions-Installation (Docker + Traefik)
├── start.sh                   # Entwicklung: Backend + Frontend starten
├── docker-compose.yml         # PostgreSQL + Redis (Entwicklung)
├── docker-compose.prod.yml    # Produktion mit Traefik SSL
└── CLAUDE.md                  # Projektkontext fuer Claude Code
```

---

## API-Endpunkte (Auswahl)

### Auth
- `POST /auth/registrieren` — Verein + Admin registrieren
- `POST /auth/anmelden` — Login (mit Berechtigungen + Vereinsrollen)
- `GET /auth/profil` — Eigenes Profil

### Mitglieder
- `GET /mitglieder` — Alle Mitglieder (mit Geburtsdatum, Eintrittsdatum)
- `POST /mitglieder` — Mitglied anlegen
- `POST /mitglieder/batch-freigeben` — Ausstehende freigeben

### Teams
- `GET /teams/:id/anwesenheit?wochen=12` — Anwesenheitsstatistik

### Mannschaftskasse
- `GET /kasse/:teamId` — Kassenstand + Buchungen
- `POST /kasse/:teamId/strafe` — Strafe verhaengen
- `GET /kasse/:teamId/saldo` — Saldo pro Mitglied

### Vereinsrollen
- `GET /rollen-vorlagen` — Alle Rollenvorlagen des Vereins
- `PUT /benutzer/verwaltung/:id/vereinsrollen` — Rollen zuweisen

### KI
- `POST /trainingsplaene/:teamId` — KI-Trainingsplan generieren
- `POST /spielberichte/:eventId` — Spielbericht + KI-Text

### Wetter
- `GET /wetter/event/:eventId` — Wetter fuer ein Event

### Ressourcen
- `GET /buchungen?ressourceId&start&ende` — Buchungen im Zeitraum
- `POST /buchungen` — Neue Buchung (mit Konflikt-Pruefung)

### Affiliate
- `GET /referral/mein-code` — Empfehlungscode abrufen
- `POST /referral/einloesen` — Code einloesen (kein Login noetig)

Vollstaendige API-Dokumentation: `http://localhost:3001/api/docs` (Swagger UI)

---

## Lizenz

Proprietaer. Alle Rechte vorbehalten.
