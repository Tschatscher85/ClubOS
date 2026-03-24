# Vereinbase - Installationsanleitung

## Optionen

Es gibt zwei Wege Vereinbase zu betreiben:

1. **Direkt mit Node.js + PM2** (empfohlen fuer Entwicklung und kleinere Deployments)
2. **Docker + Traefik** (empfohlen fuer Self-Hosting mit automatischem SSL)

---

## Option 1: Node.js + PM2 (Produktiv-Setup)

### Voraussetzungen

- **Server:** Ubuntu 22.04 oder 24.04
- **RAM:** Mindestens 2 GB (4 GB empfohlen)
- **Speicher:** Mindestens 10 GB frei
- **Node.js:** 18+ (empfohlen: 20 LTS)
- **PostgreSQL:** 15+
- **Redis:** 7+

### Schnelle Installation

```bash
# Repository klonen
git clone https://github.com/Tschatscher85/Vereinbase.git
cd Vereinbase

# Automatisches Setup (installiert PostgreSQL, Redis, Node.js, richtet DB ein)
sudo bash setup.sh

# Starten (Development)
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
# WICHTIG: JWT_SECRET und JWT_REFRESH_SECRET aendern!

# Datenbank erstellen und migrieren
createdb vereinbase_dev
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma

# Testdaten einfuegen
cd apps/backend && npx ts-node prisma/seed.ts && cd ../..
```

### Produktions-Build und Start

```bash
# Frontend bauen (standalone)
npx turbo build --filter=@vereinbase/frontend

# Backend bauen
npm run build --workspace=apps/backend

# Mit PM2 starten
pm2 start ecosystem.config.js

# PM2 beim Systemstart automatisch starten
sudo bash scripts/setup-pm2-systemd.sh
```

### PM2 Prozesse

| Prozess | Port | Beschreibung |
|---------|------|--------------|
| vereinbase-frontend | 3000 | Next.js (standalone) |
| vereinbase-backend | 3001 | NestJS API |

```bash
# Status anzeigen
pm2 status

# Logs anzeigen
pm2 logs vereinbase-backend
pm2 logs vereinbase-frontend

# Neustart
pm2 restart vereinbase-backend
pm2 restart vereinbase-frontend
```

---

## Option 2: Docker + Traefik (Self-Hosting)

### Voraussetzungen

- **Docker:** Engine 24+ mit Docker Compose v2
- **Domain:** Fuer automatische SSL-Zertifikate (optional)

### Docker installieren (falls noch nicht vorhanden)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Abmelden und neu anmelden
```

### Schnelle Installation

```bash
git clone https://github.com/Tschatscher85/Vereinbase.git
cd Vereinbase
chmod +x install.sh
./install.sh
```

Das Skript:
1. Prueft Docker und Docker Compose
2. Generiert sichere Passwoerter und Secrets
3. Fragt nach Domain, SMTP und KI-Einstellungen
4. Baut die Docker-Images
5. Startet alle Services
6. Fuehrt Datenbank-Migrationen aus

### Manuelle Docker-Installation

```bash
# Konfiguration erstellen
cp .env.example .env

# Sichere Secrets generieren
export JWT_SECRET=$(openssl rand -base64 48)
export JWT_REFRESH_SECRET=$(openssl rand -base64 48)
export DB_PASSWORD=$(openssl rand -base64 32)

# DATABASE_URL zusammenbauen
# DATABASE_URL=postgresql://vereinbase:${DB_PASSWORD}@postgres:5432/vereinbase

# Services bauen und starten
docker compose -f docker-compose.prod.yml up -d --build

# Datenbank einrichten
docker compose -f docker-compose.prod.yml exec backend \
  npx prisma db push --schema=apps/backend/prisma/schema.prisma

# Status pruefen
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3001/health
```

---

## Konfiguration

### Pflichtfelder (.env)

| Variable | Beschreibung |
|---|---|
| `DATABASE_URL` | PostgreSQL Connection String |
| `JWT_SECRET` | Geheimer Schluessel fuer Access Tokens |
| `JWT_REFRESH_SECRET` | Geheimer Schluessel fuer Refresh Tokens |
| `FRONTEND_URL` | Oeffentliche URL des Frontends (z.B. https://vereinbase.de) |

### Domain und SSL

```env
DOMAIN=vereinbase.meinverein.de
ACME_EMAIL=admin@meinverein.de
FRONTEND_URL=https://vereinbase.meinverein.de
NEXT_PUBLIC_API_URL=https://api.vereinbase.meinverein.de
```

DNS-Eintraege:
- `vereinbase.meinverein.de` → Server-IP (A-Record)
- `api.vereinbase.meinverein.de` → Server-IP (A-Record)

### E-Mail (SMTP)

```env
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_USER=dein-smtp-benutzer
SMTP_PASS=dein-smtp-passwort
SMTP_FROM=noreply@meinverein.de
```

Alternativ: Pro Verein konfigurierbar unter **Einstellungen → E-Mail**.

### IMAP (Posteingang, optional)

```env
IMAP_HOST=imap.dein-provider.de
IMAP_PORT=993
IMAP_USER=info@meinverein.de
IMAP_PASS=dein-passwort
```

Pro Benutzer konfigurierbar unter **Einstellungen → E-Mail**.

### KI-Integration (optional)

```env
# Anthropic (empfohlen)
KI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Oder OpenAI
KI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

Alternativ: Per Superadmin Web-UI konfigurierbar (Plattform-Keys), pro Verein freischaltbar.

### Web Push (optional)

```bash
# VAPID-Keys generieren (einmalig)
npx web-push generate-vapid-keys
```

```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=admin@meinverein.de
NEXT_PUBLIC_VAPID_PUBLIC_KEY=... (gleicher Public Key)
```

### Sentry Monitoring (optional)

```env
SENTRY_DSN_BACKEND=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Updates

### PM2-Setup

```bash
git pull origin main
npm install
npm run build --workspace=packages/shared
npx turbo build --filter=@vereinbase/frontend
npm run build --workspace=apps/backend
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma
pm2 restart all
```

### Docker-Setup

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend \
  npx prisma db push --schema=apps/backend/prisma/schema.prisma
```

---

## Backup

### Automatisches Backup (eingebaut)

Vereinbase erstellt automatisch taegliche Backups um 03:00 Uhr:
- 30 Tage Daily-Backups
- Monatliche Langzeit-Backups
- Pro-Verein-Export moeglich (Admin-Dashboard)

### Manuelles Backup

```bash
# PM2-Setup
pg_dump -U vereinbase vereinbase_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Docker-Setup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U vereinbase vereinbase > backup_$(date +%Y%m%d_%H%M%S).sql

# Wiederherstellen
psql -U vereinbase vereinbase_dev < backup_20260324_120000.sql
```

---

## Troubleshooting

### Backend startet nicht

```bash
# PM2 Logs pruefen
pm2 logs vereinbase-backend --lines 50

# Haeufige Ursachen:
# - DATABASE_URL falsch → PostgreSQL-Verbindung pruefen
# - Port 3001 belegt → fuser -k 3001/tcp
# - Prisma-Schema nicht aktuell → npx prisma migrate deploy
```

### Frontend startet nicht

```bash
pm2 logs vereinbase-frontend --lines 50

# Haeufige Ursachen:
# - Build nicht aktuell → npx turbo build --filter=@vereinbase/frontend
# - Port 3000 belegt → fuser -k 3000/tcp
```

### Datenbank-Berechtigungsfehler

Falls "permission denied for schema public":
```bash
# Als DB-Owner Berechtigungen vergeben
psql -h localhost -U <alter_owner> -d vereinbase_dev -c "
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vereinbase;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vereinbase;
"
```

### SSL-Zertifikat wird nicht erstellt (Docker)

1. DNS-Eintraege pruefen (muessen auf Server zeigen)
2. Port 80 und 443 von aussen erreichbar?
3. `docker compose -f docker-compose.prod.yml logs traefik`

### Alles zuruecksetzen

```bash
# PM2-Setup
pm2 stop all
dropdb vereinbase_dev
createdb vereinbase_dev
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma
npx prisma db seed --schema=apps/backend/prisma/schema.prisma
pm2 restart all

# Docker-Setup
docker compose -f docker-compose.prod.yml down -v  # ACHTUNG: Loescht alle Daten!
./install.sh
```
