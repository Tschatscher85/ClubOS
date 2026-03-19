#!/bin/bash
# Vereinbase - Taegliches Datenbank-Backup
# Ausfuehren per Cronjob: 0 3 * * * /home/tschatscher/clubos/scripts/backup.sh
#
# Konfiguration:
#   BACKUP_DIR    - Lokales Backup-Verzeichnis (Standard: /home/tschatscher/backups/vereinbase)
#   NAS_DIR       - NAS-Zielverzeichnis fuer rsync (optional, z.B. /mnt/nas/backups/vereinbase)
#   DATABASE_URL  - PostgreSQL Connection String (aus .env)
#   TAGE_BEHALTEN - Tage fuer taegliche Backups (Standard: 30)

set -euo pipefail

# Konfiguration
BACKUP_DIR="${BACKUP_DIR:-/home/tschatscher/backups/vereinbase}"
NAS_DIR="${NAS_DIR:-}"
TAGE_BEHALTEN="${TAGE_BEHALTEN:-30}"
DATUM=$(date +%Y-%m-%d_%H%M)
MONATSTAG=$(date +%d)
LOG_DATEI="${BACKUP_DIR}/backup.log"

# .env laden falls vorhanden
ENV_DATEI="/home/tschatscher/clubos/apps/backend/.env"
if [ -f "$ENV_DATEI" ]; then
  export $(grep -E '^DATABASE_URL=' "$ENV_DATEI" | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[FEHLER] DATABASE_URL nicht gesetzt" >&2
  exit 1
fi

# Verzeichnisse erstellen
mkdir -p "${BACKUP_DIR}/taeglich"
mkdir -p "${BACKUP_DIR}/monatlich"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DATEI"
}

log "=== Backup gestartet ==="

# 1. Volles Datenbank-Backup (pg_dump)
BACKUP_DATEI="${BACKUP_DIR}/taeglich/vereinbase_${DATUM}.sql.gz"
log "Erstelle Datenbank-Dump: ${BACKUP_DATEI}"

pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_DATEI}"
GROESSE=$(du -h "${BACKUP_DATEI}" | cut -f1)
log "Dump erstellt: ${GROESSE}"

# 2. Am 1. des Monats: Kopie als Monats-Backup
if [ "$MONATSTAG" = "01" ]; then
  MONATS_DATEI="${BACKUP_DIR}/monatlich/vereinbase_$(date +%Y-%m).sql.gz"
  cp "${BACKUP_DATEI}" "${MONATS_DATEI}"
  log "Monats-Backup erstellt: ${MONATS_DATEI}"
fi

# 3. Alte taegliche Backups loeschen (aelter als TAGE_BEHALTEN Tage)
GELOESCHT=$(find "${BACKUP_DIR}/taeglich" -name "*.sql.gz" -mtime +${TAGE_BEHALTEN} -delete -print | wc -l)
if [ "$GELOESCHT" -gt 0 ]; then
  log "${GELOESCHT} alte taegliche Backups geloescht"
fi

# 4. Pro-Verein-Export (JSON)
VEREIN_DIR="${BACKUP_DIR}/vereine/${DATUM}"
mkdir -p "${VEREIN_DIR}"
log "Erstelle Pro-Verein-Exports..."

# Alle Tenant-Slugs abfragen und einzeln exportieren
SLUGS=$(psql "${DATABASE_URL}" -t -A -c "SELECT slug FROM \"Tenant\"" 2>/dev/null || echo "")
if [ -n "$SLUGS" ]; then
  while IFS= read -r SLUG; do
    [ -z "$SLUG" ] && continue
    TENANT_ID=$(psql "${DATABASE_URL}" -t -A -c "SELECT id FROM \"Tenant\" WHERE slug='${SLUG}'")
    VEREIN_DATEI="${VEREIN_DIR}/${SLUG}.json"

    # Kernentitaeten pro Verein als JSON exportieren
    psql "${DATABASE_URL}" -t -A -c "
      SELECT json_build_object(
        'tenant', (SELECT row_to_json(t) FROM \"Tenant\" t WHERE t.id='${TENANT_ID}'),
        'mitglieder', (SELECT json_agg(row_to_json(m)) FROM \"Member\" m WHERE m.\"tenantId\"='${TENANT_ID}'),
        'teams', (SELECT json_agg(row_to_json(tm)) FROM \"Team\" tm WHERE tm.\"tenantId\"='${TENANT_ID}'),
        'events', (SELECT json_agg(row_to_json(e)) FROM \"Event\" e WHERE e.\"tenantId\"='${TENANT_ID}'),
        'benutzer', (SELECT json_agg(json_build_object('id', u.id, 'email', u.email, 'role', u.role, 'name', u.name)) FROM \"User\" u WHERE u.\"tenantId\"='${TENANT_ID}')
      )
    " > "${VEREIN_DATEI}" 2>/dev/null || true

    log "  Export: ${SLUG}"
  done <<< "$SLUGS"
fi

# Verein-Exports als ZIP komprimieren
if command -v zip &>/dev/null && [ -n "$(ls -A "${VEREIN_DIR}" 2>/dev/null)" ]; then
  ZIP_DATEI="${BACKUP_DIR}/vereine/vereinbase_vereine_${DATUM}.zip"
  (cd "${VEREIN_DIR}" && zip -q "${ZIP_DATEI}" *.json 2>/dev/null) || true
  log "Verein-ZIP erstellt: ${ZIP_DATEI}"
fi

# Alte Verein-Exports loeschen (aelter als 7 Tage, ZIP bleibt 30 Tage)
find "${BACKUP_DIR}/vereine" -maxdepth 1 -type d -name "20*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
find "${BACKUP_DIR}/vereine" -name "*.zip" -mtime +${TAGE_BEHALTEN} -delete 2>/dev/null || true

# 5. Auf NAS synchronisieren (falls konfiguriert)
if [ -n "${NAS_DIR}" ] && [ -d "${NAS_DIR}" ]; then
  log "Synchronisiere auf NAS: ${NAS_DIR}"
  rsync -a --delete "${BACKUP_DIR}/" "${NAS_DIR}/"
  log "NAS-Sync abgeschlossen"
elif [ -n "${NAS_DIR}" ]; then
  log "WARNUNG: NAS-Verzeichnis ${NAS_DIR} nicht erreichbar"
fi

log "=== Backup abgeschlossen ==="
