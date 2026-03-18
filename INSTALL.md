# ClubOS - Installationsanleitung (Self-Hosting)

## Voraussetzungen

- **Server:** Ubuntu 22.04 oder 24.04 (andere Linux-Distributionen funktionieren ebenfalls)
- **RAM:** Mindestens 2 GB (4 GB empfohlen)
- **Speicher:** Mindestens 10 GB frei
- **Docker:** Docker Engine 24+ installiert
- **Docker Compose:** v2 (im Docker-Paket enthalten)
- **Domain:** Optional - fuer SSL-Zertifikate wird eine Domain benoetigt

### Docker installieren (falls noch nicht vorhanden)

```bash
# Docker installieren (Ubuntu)
curl -fsSL https://get.docker.com | sh

# Aktuellen Benutzer zur Docker-Gruppe hinzufuegen
sudo usermod -aG docker $USER

# Abmelden und neu anmelden, damit die Gruppenaenderung wirkt
```

---

## Schnelle Installation

```bash
# Repository klonen
git clone https://github.com/Tschatscher85/ClubOS.git
cd clubos

# Installationsskript ausfuehren
chmod +x install.sh
./install.sh
```

Das Skript erledigt automatisch:
1. Prueft ob Docker und Docker Compose installiert sind
2. Generiert sichere Passwoerter und Secrets
3. Fragt nach Domain, SMTP und KI-Einstellungen
4. Baut die Docker-Images
5. Startet alle Services
6. Fuehrt Datenbank-Migrationen aus

---

## Manuelle Installation

### 1. Repository klonen

```bash
git clone https://github.com/Tschatscher85/ClubOS.git
cd clubos
```

### 2. Konfiguration erstellen

```bash
cp .env.example .env
```

Die `.env` Datei bearbeiten und mindestens diese Werte setzen:

```bash
# Sichere Passwoerter generieren
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)
```

Alle Pflichtfelder in der `.env` ausfuellen (siehe Abschnitt "Konfiguration").

### 3. DATABASE_URL zusammenbauen

In der `.env` die DATABASE_URL mit dem gesetzten Passwort aktualisieren:

```
DATABASE_URL=postgresql://clubos:DEIN_DB_PASSWORT@postgres:5432/clubos
```

### 4. Services starten

```bash
# Alle Services bauen und starten
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. Datenbank einrichten

```bash
# Warten bis die Datenbank bereit ist, dann Schema anwenden
docker compose -f docker-compose.prod.yml exec backend npx prisma db push --schema=apps/backend/prisma/schema.prisma
```

### 6. Pruefen ob alles laeuft

```bash
# Status aller Container anzeigen
docker compose -f docker-compose.prod.yml ps

# Health-Check
curl http://localhost:3001/health
```

---

## Konfiguration

### Pflichtfelder

| Variable | Beschreibung |
|---|---|
| `DB_PASSWORD` | Datenbank-Passwort (wird automatisch generiert) |
| `JWT_SECRET` | Geheimer Schluessel fuer Access Tokens |
| `JWT_REFRESH_SECRET` | Geheimer Schluessel fuer Refresh Tokens |
| `DATABASE_URL` | Vollstaendige Datenbank-URL |

### Domain und SSL

Fuer den Betrieb mit eigener Domain und automatischem SSL-Zertifikat:

```env
DOMAIN=clubos.meinverein.de
ACME_EMAIL=admin@meinverein.de
FRONTEND_URL=https://clubos.meinverein.de
NEXT_PUBLIC_API_URL=https://api.clubos.meinverein.de
```

Wichtig: Die DNS-Eintraege muessen auf den Server zeigen:
- `clubos.meinverein.de` -> Server-IP (A-Record)
- `api.clubos.meinverein.de` -> Server-IP (A-Record)

Zum Aktivieren von Traefik mit SSL:

```bash
docker compose -f docker-compose.prod.yml --profile ssl up -d --build
```

### E-Mail (optional)

Fuer Einladungen und Benachrichtigungen wird ein SMTP-Server benoetigt:

```env
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_USER=dein-smtp-benutzer
SMTP_PASS=dein-smtp-passwort
SMTP_FROM=noreply@meinverein.de
```

### KI-Integration (optional)

Fuer automatische Formular-Erkennung (PDF/DOCX zu digitalem Formular):

```env
# Anthropic (empfohlen)
KI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Oder OpenAI
KI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

---

## Updates

```bash
# Neueste Version holen
git pull

# Services neu bauen und starten
docker compose -f docker-compose.prod.yml up -d --build

# Datenbank-Schema aktualisieren (falls noetig)
docker compose -f docker-compose.prod.yml exec backend npx prisma db push --schema=apps/backend/prisma/schema.prisma
```

---

## Backup

### Datenbank sichern

```bash
# Backup erstellen
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U clubos clubos > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup wiederherstellen
docker compose -f docker-compose.prod.yml exec -T postgres psql -U clubos clubos < backup_20260318_120000.sql
```

### Volumes sichern

```bash
# Alle Docker-Volumes auflisten
docker volume ls | grep clubos
```

---

## Troubleshooting

### Container starten nicht

```bash
# Logs aller Services anzeigen
docker compose -f docker-compose.prod.yml logs

# Logs eines bestimmten Services
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs postgres
```

### Datenbank-Verbindung fehlgeschlagen

1. Pruefen ob PostgreSQL laeuft:
   ```bash
   docker compose -f docker-compose.prod.yml ps postgres
   ```

2. Pruefen ob das Passwort in `DATABASE_URL` mit `DB_PASSWORD` uebereinstimmt

3. Datenbank neu starten:
   ```bash
   docker compose -f docker-compose.prod.yml restart postgres
   ```

### Port bereits belegt

Falls Port 3000 oder 3001 bereits belegt ist:

```env
# In .env alternative Ports setzen
BACKEND_PORT=3002
FRONTEND_PORT=3003
```

### SSL-Zertifikat wird nicht erstellt

1. Pruefen ob DNS-Eintraege korrekt auf den Server zeigen
2. Pruefen ob Port 80 und 443 von aussen erreichbar sind
3. Traefik-Logs pruefen:
   ```bash
   docker compose -f docker-compose.prod.yml logs traefik
   ```

### Alles zuruecksetzen

```bash
# Alle Container stoppen und entfernen
docker compose -f docker-compose.prod.yml down

# ACHTUNG: Alle Daten loeschen (Datenbank, Redis, SSL-Zertifikate)
docker compose -f docker-compose.prod.yml down -v

# Neu starten
./install.sh
```

### Speicherplatz pruefen

```bash
# Docker-Speicherverbrauch anzeigen
docker system df

# Nicht verwendete Images und Container entfernen
docker system prune
```
