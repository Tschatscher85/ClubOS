#!/bin/bash
# Vereinbase - Log-Rotation (DSGVO: IP-Daten nach 7 Tagen loeschen)
# Cronjob: 0 4 * * * /home/tschatscher/vereinbase/scripts/log-rotation.sh

set -euo pipefail

# Caddy-Logs: aelter als 7 Tage loeschen
if [ -d /var/log/caddy ]; then
  find /var/log/caddy -name "*.log" -mtime +7 -delete 2>/dev/null || true
fi

# PM2-Logs: aelter als 7 Tage loeschen
find /tmp -name "vereinbase-*-*.log" -mtime +7 -delete 2>/dev/null || true

echo "$(date '+%Y-%m-%d %H:%M') Log-Rotation ausgefuehrt" >> /home/tschatscher/backups/vereinbase/cron.log
