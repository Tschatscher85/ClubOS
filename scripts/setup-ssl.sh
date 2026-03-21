#!/bin/bash
# Vereinbase SSL + Reverse Proxy Setup
# Ausfuehren: sudo bash scripts/setup-ssl.sh
#
# Voraussetzungen:
# 1. vereinbase.de A-Record zeigt auf diese VM
# 2. *.vereinbase.de CNAME oder A-Record zeigt auf diese VM
# 3. Port 80 + 443 sind offen (Firewall)

set -euo pipefail

echo "=== Vereinbase SSL Setup ==="

# 1. Caddy installieren
if ! command -v caddy &>/dev/null; then
  echo "Caddy wird installiert..."
  sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt update
  sudo apt install -y caddy
  echo "Caddy installiert."
else
  echo "Caddy bereits installiert."
fi

# 2. Caddyfile kopieren
echo "Caddyfile wird konfiguriert..."
sudo cp /home/tschatscher/vereinbase/Caddyfile /etc/caddy/Caddyfile

# 3. Log-Verzeichnis erstellen
sudo mkdir -p /var/log/caddy

# 4. Caddy starten/neuladen
echo "Caddy wird gestartet..."
sudo systemctl enable caddy
sudo systemctl restart caddy

# 5. Status pruefen
sleep 2
if sudo systemctl is-active --quiet caddy; then
  echo ""
  echo "=== SSL Setup erfolgreich! ==="
  echo "Caddy laeuft und holt automatisch SSL-Zertifikate von Let's Encrypt."
  echo ""
  echo "URLs:"
  echo "  https://vereinbase.de          (Frontend)"
  echo "  https://api.vereinbase.de      (Backend API)"
  echo "  https://fckunchen.vereinbase.de (Verein-Subdomain)"
  echo ""
  echo "Zertifikat-Status: sudo caddy list-certs"
else
  echo "FEHLER: Caddy konnte nicht gestartet werden!"
  sudo systemctl status caddy
  exit 1
fi
