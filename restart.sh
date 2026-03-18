#!/bin/bash
# ClubOS Neustart-Script
# Stoppt alle alten Prozesse, baut Frontend neu, startet alles sauber

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== ClubOS Neustart ==="
echo ""

# 1. Alte Prozesse beenden
echo "[1/4] Alte Prozesse beenden..."
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true
# Auch nest --watch und turbo Prozesse killen
pkill -f "nest start" 2>/dev/null || true
pkill -f "turbo run dev" 2>/dev/null || true
sleep 2

# 2. Frontend bauen
echo "[2/4] Frontend bauen..."
cd "$SCRIPT_DIR/apps/frontend"
npx next build

# 3. Backend starten
echo "[3/4] Backend starten..."
cd "$SCRIPT_DIR/apps/backend"
node dist/main.js &
BACKEND_PID=$!

# 4. Frontend starten
echo "[4/4] Frontend starten..."
cd "$SCRIPT_DIR/apps/frontend"
npx next start -p 3000 &
FRONTEND_PID=$!

sleep 5

echo ""
echo "=== ClubOS laeuft ==="
echo "Frontend:  http://localhost:3000  (PID: $FRONTEND_PID)"
echo "Backend:   http://localhost:3001  (PID: $BACKEND_PID)"
echo "API-Docs:  http://localhost:3001/api/docs"
echo ""
echo "Beenden mit: kill $BACKEND_PID $FRONTEND_PID"
echo "Oder:        fuser -k 3000/tcp 3001/tcp"

# Warten bis einer der Prozesse stirbt
wait
