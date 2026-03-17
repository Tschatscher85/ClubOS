# ClubOS — Die Plattform fuer Sportvereine

Multi-Tenant SaaS-Plattform die WhatsApp-Gruppen, Spielerplus, easyVerein und Turnierheld ersetzt — alles in einer App, DSGVO-konform, deutscher Server.

## Features

- **Mitgliederverwaltung** — Anlegen, Status verwalten, Statistik
- **Mannschaften** — Teams nach Sportart und Altersklasse
- **Kalender** — Training, Spiele, Turniere planen
- **Turnier-Manager** — Spielplan, Livescoring, oeffentliche Anzeigetafel mit Auto-Refresh
- **Multi-Tenant** — Jeder Verein hat eigene Daten, Farben, Logo
- **Rollenbasiert** — Superadmin, Admin, Trainer, Mitglied, Elternteil

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Backend | NestJS, TypeScript, Prisma, PostgreSQL |
| Frontend | Next.js 14, shadcn/ui, Tailwind CSS, Zustand |
| Auth | JWT + Refresh Tokens |
| Monorepo | npm Workspaces + Turborepo |

## Installation (Linux Ubuntu/Debian)

### Voraussetzung
- Node.js 18+ installiert

### Setup

```bash
# Repository klonen
git clone https://github.com/Tschatscher85/ClubOS.git
cd ClubOS

# Setup ausfuehren (installiert PostgreSQL, Redis, richtet DB ein, seedet Testdaten)
sudo bash setup.sh

# Starten
bash start.sh
```

### Manuelles Setup (falls setup.sh nicht verwendet wird)

```bash
# Dependencies installieren
npm install

# Shared Package bauen
npm run build --workspace=packages/shared

# Prisma Client generieren
npx prisma generate --schema=apps/backend/prisma/schema.prisma

# .env aus Vorlage erstellen und anpassen
cp .env.example .env

# Datenbank-Schema anwenden (PostgreSQL muss laufen)
npx prisma db push --schema=apps/backend/prisma/schema.prisma

# Testdaten einfuegen
cd apps/backend && npx ts-node prisma/seed.ts && cd ../..

# Backend starten
npm run dev --workspace=apps/backend

# Frontend starten (in neuem Terminal)
npm run dev --workspace=apps/frontend
```

### Zugriff von anderem Rechner

Falls Frontend und Backend auf einem Server laufen und vom Browser eines anderen Rechners zugegriffen wird:

```bash
# API-URL auf Server-IP setzen
echo 'NEXT_PUBLIC_API_URL=http://<SERVER-IP>:3001' > apps/frontend/.env.local

# Frontend neu starten
```

## URLs

| Was | URL |
|-----|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger API-Docs | http://localhost:3001/api/docs |
| Turnier Live-Ansicht | http://localhost:3000/turnier/{publicUrl} |

## Test-Zugangsdaten

Passwort fuer alle: `ClubOS2024!`

| Rolle | E-Mail |
|-------|--------|
| Superadmin | admin@clubos.de |
| Admin | vorstand@fckunchen.de |
| Trainer | trainer@fckunchen.de |
| Mitglied | spieler@fckunchen.de |

## Projektstruktur

```
clubos/
├── apps/
│   ├── backend/          # NestJS API (Port 3001)
│   │   ├── prisma/       # Datenbank-Schema + Seed
│   │   └── src/
│   │       ├── auth/     # JWT Authentifizierung
│   │       ├── member/   # Mitgliederverwaltung
│   │       ├── team/     # Mannschaften
│   │       ├── event/    # Kalender/Veranstaltungen
│   │       ├── tournament/ # Turnier-Manager
│   │       ├── tenant/   # Vereinsverwaltung
│   │       ├── user/     # Benutzerverwaltung
│   │       └── common/   # Guards, Filter, Decorators
│   └── frontend/         # Next.js Web-App (Port 3000)
│       └── src/
│           ├── app/      # Seiten (App Router)
│           ├── components/ # UI-Komponenten
│           ├── stores/   # Zustand State Management
│           └── lib/      # API-Client, Theme, Utils
├── packages/
│   └── shared/           # Gemeinsame Types, Enums, Konstanten
├── setup.sh              # Automatisches Linux-Setup
├── start.sh              # Backend + Frontend starten
├── docker-compose.yml    # PostgreSQL + Redis
└── docker-compose.prod.yml # Produktion mit Traefik
```

## API-Endpunkte

### Auth
- `POST /auth/registrieren` — Verein + Admin registrieren
- `POST /auth/anmelden` — Login
- `POST /auth/abmelden` — Logout
- `POST /auth/token-aktualisieren` — Token erneuern
- `GET /auth/profil` — Eigenes Profil

### Mitglieder
- `GET /mitglieder` — Alle Mitglieder
- `GET /mitglieder/statistik` — Statistik
- `POST /mitglieder` — Mitglied anlegen
- `PUT /mitglieder/:id` — Bearbeiten
- `DELETE /mitglieder/:id` — Loeschen

### Teams
- `GET /teams` — Alle Teams
- `POST /teams` — Team erstellen
- `PUT /teams/:id` — Bearbeiten
- `DELETE /teams/:id` — Loeschen

### Veranstaltungen
- `GET /veranstaltungen` — Alle Events
- `GET /veranstaltungen/kommende` — Kommende Events
- `POST /veranstaltungen` — Event erstellen

### Turniere
- `GET /turniere` — Alle Turniere
- `POST /turniere` — Turnier erstellen
- `POST /turniere/:id/spiele` — Spiel hinzufuegen
- `PUT /turniere/:id/spiele/:spielId` — Ergebnis eintragen
- `PATCH /turniere/:id/live` — Live schalten
- `GET /turniere/live/:publicUrl` — Oeffentliche Ansicht (kein Login)
