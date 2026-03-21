#!/bin/bash
# Vereinbase PM2 Systemd Setup Script
# Macht PM2 zum systemd-Service fuer Auto-Start nach Reboot
#
# Ausfuehren mit: sudo bash scripts/setup-pm2-systemd.sh (aus dem Projektordner)

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Vereinbase PM2 Systemd Setup ==="
echo ""

# Step 1: PM2 global installieren
echo "[1/6] PM2 global installieren..."
npm install -g pm2
echo "PM2 Version: $(pm2 --version)"
echo ""

# Step 2: Laufende PM2-Instanzen stoppen (falls npx-Version laeuft)
echo "[2/6] Alte PM2-Instanzen stoppen..."
su - tschatscher -c "npx pm2 kill" 2>/dev/null || true
echo ""

# Step 3: PM2 Startup-Script generieren und installieren
echo "[3/6] PM2 systemd Startup konfigurieren..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u tschatscher --hp /home/tschatscher
echo ""

# Step 4: Apps mit PM2 starten
echo "[4/6] Vereinbase Apps starten..."
su - tschatscher -c "cd $PROJECT_DIR && pm2 start ecosystem.config.js"
echo ""

# Step 5: PM2 Prozessliste speichern
echo "[5/6] PM2 Prozessliste speichern..."
su - tschatscher -c "pm2 save"
echo ""

# Step 6: Alles pruefen
echo "[6/6] Verifizierung..."
echo ""
echo "--- PM2 Status ---"
su - tschatscher -c "pm2 status"
echo ""
echo "--- systemd Services ---"
echo "pm2-tschatscher: $(systemctl is-enabled pm2-tschatscher 2>/dev/null || echo 'NICHT GEFUNDEN')"
echo "postgresql:      $(systemctl is-enabled postgresql 2>/dev/null || echo 'NICHT GEFUNDEN')"
echo "redis-server:    $(systemctl is-enabled redis-server 2>/dev/null || echo 'NICHT GEFUNDEN')"
echo ""

# Kurz warten und Logs pruefen
sleep 3
echo "--- App-Logs (letzte 10 Zeilen) ---"
su - tschatscher -c "pm2 logs --lines 10 --nostream" 2>/dev/null || true
echo ""

echo "=== Setup abgeschlossen! ==="
echo ""
echo "Nuetzliche Befehle:"
echo "  pm2 status          - Status anzeigen"
echo "  pm2 logs            - Logs anzeigen"
echo "  pm2 restart all     - Alles neustarten"
echo "  pm2 save            - Aktuelle Prozessliste speichern"
echo "  sudo reboot         - Testen ob Auto-Start funktioniert"
