#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  Vereinbase starten"
echo "=========================================="
echo ""

# Pruefen ob PostgreSQL laeuft
if ! systemctl is-active --quiet postgresql 2>/dev/null; then
  echo "PostgreSQL starten..."
  sudo systemctl start postgresql
fi

# Pruefen ob Redis laeuft
if ! systemctl is-active --quiet redis-server 2>/dev/null; then
  echo "Redis starten..."
  sudo systemctl start redis-server
fi

# Pruefen ob node_modules existiert
if [ ! -d "node_modules" ]; then
  echo "Abhaengigkeiten werden installiert..."
  npm install
  npm run build --workspace=packages/shared
  npx prisma generate --schema=apps/backend/prisma/schema.prisma
fi

echo "Backend starten auf Port 3001..."
echo "Frontend starten auf Port 3000..."
echo ""
echo "Backend:  http://localhost:3001"
echo "API-Docs: http://localhost:3001/api/docs"
echo "Frontend: http://localhost:3000"
echo ""
echo "Beenden mit Strg+C"
echo ""

# Backend und Frontend parallel starten
npx turbo run dev --parallel
