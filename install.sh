#!/bin/bash
# ============================================================
# ClubOS - Schnelle Installation
# ============================================================
# Voraussetzungen: Docker + Docker Compose (v2) installiert
# Ausfuehrung:
#   curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash
# Oder:
#   git clone ... && cd clubos && chmod +x install.sh && ./install.sh
# ============================================================

set -e

# Farben fuer die Ausgabe
ROT='\033[0;31m'
GRUEN='\033[0;32m'
GELB='\033[1;33m'
BLAU='\033[0;34m'
NC='\033[0m' # Keine Farbe

# Hilfsfunktionen
info() {
  echo -e "${BLAU}[INFO]${NC} $1"
}

erfolg() {
  echo -e "${GRUEN}[OK]${NC} $1"
}

warnung() {
  echo -e "${GELB}[WARNUNG]${NC} $1"
}

fehler() {
  echo -e "${ROT}[FEHLER]${NC} $1"
  exit 1
}

# Zufaelliges Passwort/Secret generieren
zufalls_secret() {
  openssl rand -base64 48 | tr -d '/+=' | head -c 64
}

echo ""
echo -e "${BLAU}============================================================${NC}"
echo -e "${BLAU}       ClubOS - Self-Hosting Installation${NC}"
echo -e "${BLAU}       Die Plattform fuer Sportvereine${NC}"
echo -e "${BLAU}============================================================${NC}"
echo ""

# ============================================================
# 1. Voraussetzungen pruefen
# ============================================================
info "Pruefe Voraussetzungen..."

# Docker pruefen
if ! command -v docker &> /dev/null; then
  fehler "Docker ist nicht installiert. Bitte installiere Docker: https://docs.docker.com/engine/install/"
fi
erfolg "Docker gefunden: $(docker --version)"

# Docker Compose (v2) pruefen
if ! docker compose version &> /dev/null; then
  fehler "Docker Compose (v2) ist nicht installiert. Bitte installiere Docker Compose: https://docs.docker.com/compose/install/"
fi
erfolg "Docker Compose gefunden: $(docker compose version --short)"

# Pruefen ob Docker-Daemon laeuft
if ! docker info &> /dev/null; then
  fehler "Docker-Daemon laeuft nicht. Bitte starte Docker: sudo systemctl start docker"
fi
erfolg "Docker-Daemon laeuft"

echo ""

# ============================================================
# 2. .env Datei vorbereiten
# ============================================================
info "Konfiguration vorbereiten..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f .env ]; then
  warnung ".env Datei existiert bereits. Bestehende Werte werden beibehalten."
  # Bestehende .env laden
  set -a
  source .env
  set +a
else
  if [ -f .env.example ]; then
    cp .env.example .env
    info ".env aus .env.example erstellt."
  else
    touch .env
    info "Neue .env Datei erstellt."
  fi
fi

echo ""

# ============================================================
# 3. Secrets generieren (falls nicht gesetzt)
# ============================================================
info "Sichere Secrets generieren..."

# Funktion: Wert in .env setzen (nur wenn noch nicht vorhanden oder Standardwert)
setze_env() {
  local key="$1"
  local wert="$2"
  local datei=".env"

  if grep -q "^${key}=" "$datei" 2>/dev/null; then
    # Key existiert - nur ueberschreiben wenn Standardwert
    local aktueller_wert
    aktueller_wert=$(grep "^${key}=" "$datei" | cut -d'=' -f2-)
    if [ "$aktueller_wert" = "dein-geheimer-jwt-schluessel-hier-aendern" ] || \
       [ "$aktueller_wert" = "dein-geheimer-refresh-schluessel-hier-aendern" ] || \
       [ "$aktueller_wert" = "clubos_dev_pw" ] || \
       [ -z "$aktueller_wert" ]; then
      sed -i "s|^${key}=.*|${key}=${wert}|" "$datei"
      info "${key} wurde mit sicherem Wert aktualisiert."
    fi
  else
    echo "${key}=${wert}" >> "$datei"
    info "${key} wurde hinzugefuegt."
  fi
}

# Secrets generieren
JWT_SECRET_NEU=$(zufalls_secret)
JWT_REFRESH_SECRET_NEU=$(zufalls_secret)
DB_PASSWORD_NEU=$(zufalls_secret | head -c 32)

setze_env "JWT_SECRET" "$JWT_SECRET_NEU"
setze_env "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET_NEU"
setze_env "DB_PASSWORD" "$DB_PASSWORD_NEU"

# Standard-Datenbankwerte sicherstellen
setze_env "DB_NAME" "clubos"
setze_env "DB_USER" "clubos"
setze_env "NODE_ENV" "production"
setze_env "PORT" "3001"
setze_env "JWT_EXPIRATION" "15m"
setze_env "JWT_REFRESH_EXPIRATION" "7d"

erfolg "Secrets wurden generiert."
echo ""

# ============================================================
# 4. Benutzerabfragen
# ============================================================
info "Konfiguration - bitte Fragen beantworten (Enter fuer Standardwert):"
echo ""

# Domain abfragen
read -rp "Domain (Standard: localhost): " DOMAIN_INPUT
DOMAIN="${DOMAIN_INPUT:-localhost}"
setze_env "DOMAIN" "$DOMAIN"

if [ "$DOMAIN" != "localhost" ]; then
  read -rp "E-Mail fuer SSL-Zertifikat (Let's Encrypt): " ACME_EMAIL_INPUT
  ACME_EMAIL="${ACME_EMAIL_INPUT:-admin@${DOMAIN}}"
  setze_env "ACME_EMAIL" "$ACME_EMAIL"
  setze_env "NEXT_PUBLIC_API_URL" "https://api.${DOMAIN}"
  setze_env "FRONTEND_URL" "https://${DOMAIN}"
else
  setze_env "NEXT_PUBLIC_API_URL" "http://localhost:3001"
  setze_env "FRONTEND_URL" "http://localhost:3000"
fi

echo ""

# SMTP-Konfiguration
read -rp "SMTP konfigurieren? (j/N): " SMTP_ANTWORT
if [[ "$SMTP_ANTWORT" =~ ^[jJ]$ ]]; then
  read -rp "  SMTP Host: " SMTP_HOST
  read -rp "  SMTP Port (Standard: 587): " SMTP_PORT_INPUT
  SMTP_PORT="${SMTP_PORT_INPUT:-587}"
  read -rp "  SMTP Benutzer: " SMTP_USER
  read -rsp "  SMTP Passwort: " SMTP_PASS
  echo ""
  read -rp "  Absender E-Mail: " SMTP_FROM

  setze_env "SMTP_HOST" "$SMTP_HOST"
  setze_env "SMTP_PORT" "$SMTP_PORT"
  setze_env "SMTP_USER" "$SMTP_USER"
  setze_env "SMTP_PASS" "$SMTP_PASS"
  setze_env "SMTP_FROM" "$SMTP_FROM"
  erfolg "SMTP konfiguriert."
else
  info "SMTP uebersprungen - E-Mails werden nicht versendet."
fi

echo ""

# KI-Provider
read -rp "KI-Provider fuer Formular-Erkennung (anthropic/openai/ueberspringen) [ueberspringen]: " KI_ANTWORT
case "$KI_ANTWORT" in
  anthropic)
    read -rsp "  Anthropic API Key: " ANTHROPIC_KEY
    echo ""
    setze_env "ANTHROPIC_API_KEY" "$ANTHROPIC_KEY"
    setze_env "KI_PROVIDER" "anthropic"
    erfolg "Anthropic API konfiguriert."
    ;;
  openai)
    read -rsp "  OpenAI API Key: " OPENAI_KEY
    echo ""
    setze_env "OPENAI_API_KEY" "$OPENAI_KEY"
    setze_env "KI_PROVIDER" "openai"
    erfolg "OpenAI API konfiguriert."
    ;;
  *)
    info "KI-Unterstuetzung uebersprungen."
    ;;
esac

echo ""

# DATABASE_URL zusammenbauen
# Werte aus .env neu laden
set -a
source .env
set +a
setze_env "DATABASE_URL" "postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}"
setze_env "REDIS_URL" "redis://redis:6379"

erfolg "Konfiguration gespeichert in .env"
echo ""

# ============================================================
# 5. Docker Images bauen und starten
# ============================================================
info "Docker-Container werden gebaut und gestartet..."
info "Das kann beim ersten Mal einige Minuten dauern..."
echo ""

if [ "$DOMAIN" = "localhost" ]; then
  # Lokaler Modus: Ohne Traefik, Ports direkt exponieren
  info "Lokaler Modus (ohne SSL/Traefik)..."
  docker compose -f docker-compose.prod.yml up -d --build postgres redis
else
  # Produktionsmodus: Mit Traefik und SSL
  info "Produktionsmodus mit SSL fuer ${DOMAIN}..."
  docker compose -f docker-compose.prod.yml up -d --build
fi

echo ""

# ============================================================
# 6. Auf gesunde Services warten
# ============================================================
info "Warte auf Datenbank..."

RETRIES=30
until docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "${DB_USER:-clubos}" -d "${DB_NAME:-clubos}" > /dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    fehler "Datenbank ist nach 30 Versuchen nicht bereit. Pruefe: docker compose -f docker-compose.prod.yml logs postgres"
  fi
  sleep 2
done
erfolg "Datenbank ist bereit."

info "Warte auf Redis..."
RETRIES=15
until docker compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    fehler "Redis ist nach 15 Versuchen nicht bereit."
  fi
  sleep 2
done
erfolg "Redis ist bereit."

# Restliche Services starten (falls noch nicht)
if [ "$DOMAIN" = "localhost" ]; then
  docker compose -f docker-compose.prod.yml up -d --build backend frontend
else
  docker compose -f docker-compose.prod.yml up -d --build
fi

echo ""

# ============================================================
# 7. Prisma-Migrationen ausfuehren
# ============================================================
info "Datenbank-Schema wird angewendet..."

# Warte bis Backend-Container laeuft
RETRIES=30
until docker compose -f docker-compose.prod.yml ps backend --format '{{.State}}' 2>/dev/null | grep -q "running"; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    fehler "Backend-Container startet nicht. Pruefe: docker compose -f docker-compose.prod.yml logs backend"
  fi
  sleep 2
done

docker compose -f docker-compose.prod.yml exec -T backend npx prisma db push --schema=apps/backend/prisma/schema.prisma --accept-data-loss 2>/dev/null || \
  docker compose -f docker-compose.prod.yml exec -T backend npx prisma db push --schema=apps/backend/prisma/schema.prisma

erfolg "Datenbank-Schema wurde angewendet."
echo ""

# ============================================================
# 8. Erfolgsmeldung
# ============================================================
echo ""
echo -e "${GRUEN}============================================================${NC}"
echo -e "${GRUEN}       ClubOS wurde erfolgreich installiert!${NC}"
echo -e "${GRUEN}============================================================${NC}"
echo ""

if [ "$DOMAIN" = "localhost" ]; then
  echo -e "  Frontend:  ${BLAU}http://localhost:3000${NC}"
  echo -e "  Backend:   ${BLAU}http://localhost:3001${NC}"
  echo -e "  API Docs:  ${BLAU}http://localhost:3001/api${NC}"
  echo -e "  Health:    ${BLAU}http://localhost:3001/health${NC}"
else
  echo -e "  Frontend:  ${BLAU}https://${DOMAIN}${NC}"
  echo -e "  Backend:   ${BLAU}https://api.${DOMAIN}${NC}"
  echo -e "  API Docs:  ${BLAU}https://api.${DOMAIN}/api${NC}"
  echo -e "  Health:    ${BLAU}https://api.${DOMAIN}/health${NC}"
fi

echo ""
echo -e "  Nuetzliche Befehle:"
echo -e "    Logs ansehen:      ${GELB}docker compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "    Status pruefen:    ${GELB}docker compose -f docker-compose.prod.yml ps${NC}"
echo -e "    Stoppen:           ${GELB}docker compose -f docker-compose.prod.yml down${NC}"
echo -e "    Aktualisieren:     ${GELB}git pull && docker compose -f docker-compose.prod.yml up -d --build${NC}"
echo ""
echo -e "  Konfiguration:       ${GELB}.env${NC}"
echo ""
