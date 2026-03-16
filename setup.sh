#!/bin/bash
set -e

echo "=========================================="
echo "  ClubOS - Installation"
echo "=========================================="
echo ""

# Farben
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Pruefen ob als root ausgefuehrt (fuer apt)
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Bitte mit sudo ausfuehren: sudo bash setup.sh${NC}"
  exit 1
fi

# Aktueller Benutzer (der sudo aufgerufen hat)
REAL_USER="${SUDO_USER:-$USER}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[1/6] System-Pakete aktualisieren..."
apt-get update -qq

echo "[2/6] PostgreSQL installieren..."
if ! command -v psql &> /dev/null; then
  apt-get install -y -qq postgresql postgresql-contrib
  echo -e "${GREEN}PostgreSQL installiert.${NC}"
else
  echo "PostgreSQL bereits vorhanden."
fi

echo "[3/6] Redis installieren..."
if ! command -v redis-server &> /dev/null; then
  apt-get install -y -qq redis-server
  echo -e "${GREEN}Redis installiert.${NC}"
else
  echo "Redis bereits vorhanden."
fi

# Dienste starten
systemctl enable postgresql --quiet
systemctl start postgresql
systemctl enable redis-server --quiet
systemctl start redis-server

echo "[4/6] Node.js pruefen..."
if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js ist nicht installiert.${NC}"
  echo "Bitte Node.js 20+ installieren: https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}Node.js Version 18+ wird benoetigt (aktuell: $(node -v))${NC}"
  exit 1
fi
echo "Node.js $(node -v) gefunden."

echo "[5/6] Datenbank einrichten..."
# Passwort generieren falls .env noch nicht existiert
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  DB_PASSWORD=$(openssl rand -hex 16)
  JWT_SECRET=$(openssl rand -hex 32)
  JWT_REFRESH_SECRET=$(openssl rand -hex 32)

  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  sed -i "s/clubos_dev_pw/$DB_PASSWORD/g" "$SCRIPT_DIR/.env"
  sed -i "s/dein-geheimer-jwt-schluessel-hier-aendern/$JWT_SECRET/g" "$SCRIPT_DIR/.env"
  sed -i "s/dein-geheimer-refresh-schluessel-hier-aendern/$JWT_REFRESH_SECRET/g" "$SCRIPT_DIR/.env"

  echo -e "${GREEN}.env erstellt mit sicheren Schluesseln.${NC}"
else
  # Passwort aus bestehender .env lesen
  DB_PASSWORD=$(grep DB_PASSWORD "$SCRIPT_DIR/.env" | cut -d'=' -f2)
  echo ".env bereits vorhanden."
fi

# PostgreSQL Benutzer und Datenbank erstellen
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='clubos'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER clubos WITH PASSWORD '$DB_PASSWORD';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='clubos_dev'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE clubos_dev OWNER clubos;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE clubos_dev TO clubos;" 2>/dev/null || true

echo -e "${GREEN}Datenbank eingerichtet.${NC}"

echo "[6/6] Abhaengigkeiten installieren..."
cd "$SCRIPT_DIR"
sudo -u "$REAL_USER" npm install
sudo -u "$REAL_USER" npm run build --workspace=packages/shared
sudo -u "$REAL_USER" npx prisma generate --schema=apps/backend/prisma/schema.prisma
sudo -u "$REAL_USER" npx prisma db push --schema=apps/backend/prisma/schema.prisma
sudo -u "$REAL_USER" npx prisma db seed --schema=apps/backend/prisma/schema.prisma

echo ""
echo "=========================================="
echo -e "${GREEN}  ClubOS erfolgreich installiert!${NC}"
echo "=========================================="
echo ""
echo "Starten mit:  bash start.sh"
echo ""
echo "Test-Zugangsdaten (Passwort: ClubOS2024!):"
echo "  Superadmin: admin@clubos.de"
echo "  Admin:      vorstand@fckunchen.de"
echo "  Trainer:    trainer@fckunchen.de"
echo "  Mitglied:   spieler@fckunchen.de"
echo ""
echo "Backend:  http://localhost:3001"
echo "API-Docs: http://localhost:3001/api/docs"
echo "Frontend: http://localhost:3000"
echo ""
