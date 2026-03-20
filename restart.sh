#!/bin/bash
# Vereinbase Neustart-Script (PM2)
# Stoppt alle alten Prozesse, baut Frontend + Backend neu, startet via PM2

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Vereinbase Neustart ==="
echo ""

# 1. Alte Prozesse beenden
echo "[1/5] Alte Prozesse beenden..."
npx pm2 stop all 2>/dev/null || true
npx pm2 delete all 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true
pkill -f "turbo run dev" 2>/dev/null || true
sleep 2

# 2. Backend bauen
echo "[2/5] Backend bauen..."
cd "$SCRIPT_DIR/apps/backend"
npm run build

# 3. Frontend bauen
echo "[3/5] Frontend bauen..."
cd "$SCRIPT_DIR/apps/frontend"
npx next build

# 4. Mit PM2 starten
echo "[4/5] PM2 starten..."
cd "$SCRIPT_DIR"
npx pm2 start ecosystem.config.js

# 5. Status anzeigen
echo "[5/5] Status pruefen..."
sleep 3
npx pm2 status

echo ""
echo "=== Vereinbase laeuft ==="
echo "Frontend:  http://localhost:3000"
echo "Backend:   http://localhost:3001"
echo "API-Docs:  http://localhost:3001/api/docs"
echo ""
echo "Befehle:"
echo "  npx pm2 status       - Status anzeigen"
echo "  npx pm2 logs         - Logs anzeigen"
echo "  npx pm2 restart all  - Neustart ohne Build"
echo "  npx pm2 stop all     - Alles stoppen"
