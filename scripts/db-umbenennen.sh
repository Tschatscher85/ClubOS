#!/bin/bash
# Vereinbase - Datenbank von clubos_dev zu vereinbase_dev umbenennen
# Ausfuehren mit: sudo bash scripts/db-umbenennen.sh
#
# Dieses Script:
# 1. Erstellt einen neuen PostgreSQL User "vereinbase"
# 2. Erstellt eine neue DB "vereinbase_dev"
# 3. Kopiert alle Daten von clubos_dev nach vereinbase_dev
# 4. Aktualisiert die .env Dateien

set -e

echo "=== Vereinbase DB-Umbenennung ==="
echo ""

# 1. Neuen User erstellen
echo "[1/4] Erstelle User 'vereinbase'..."
sudo -u postgres psql -c "CREATE USER vereinbase WITH PASSWORD 'vereinbase_dev_pw' CREATEDB;" 2>/dev/null || echo "User existiert bereits"

# 2. Neue DB erstellen
echo "[2/4] Erstelle Datenbank 'vereinbase_dev'..."
sudo -u postgres psql -c "CREATE DATABASE vereinbase_dev OWNER vereinbase;" 2>/dev/null || echo "DB existiert bereits"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vereinbase_dev TO vereinbase;"

# 3. Daten kopieren
echo "[3/4] Kopiere Daten von clubos_dev nach vereinbase_dev..."
sudo -u postgres pg_dump clubos_dev | sudo -u postgres psql vereinbase_dev

# 4. .env aktualisieren
echo "[4/4] Aktualisiere .env Dateien..."
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

sed -i 's|clubos:clubos_dev_pw@localhost:5432/clubos_dev|vereinbase:vereinbase_dev_pw@localhost:5432/vereinbase_dev|g' "$SCRIPT_DIR/.env" "$SCRIPT_DIR/apps/backend/.env"
sed -i 's/DB_NAME=clubos_dev/DB_NAME=vereinbase_dev/g' "$SCRIPT_DIR/.env" "$SCRIPT_DIR/apps/backend/.env"
sed -i 's/DB_USER=clubos/DB_USER=vereinbase/g' "$SCRIPT_DIR/.env" "$SCRIPT_DIR/apps/backend/.env"
sed -i 's/DB_PASSWORD=clubos_dev_pw/DB_PASSWORD=vereinbase_dev_pw/g' "$SCRIPT_DIR/.env" "$SCRIPT_DIR/apps/backend/.env"

echo ""
echo "=== Fertig! ==="
echo "Neue DB-Verbindung: vereinbase:vereinbase_dev_pw@localhost:5432/vereinbase_dev"
echo ""
echo "Jetzt neu starten: npx pm2 restart all"
