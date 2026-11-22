#!/usr/bin/env bash
# KCJ CONTROL — compilacion controlada en Linux/macOS, sin migrar BD.
set -euo pipefail
cd "$(dirname "$0")/.."
: "${KCJ_ENTORNO_ENSAYO:?Configure KCJ_ENTORNO_ENSAYO=SI exclusivamente en entorno de ensayo}"
if [[ "$KCJ_ENTORNO_ENSAYO" != "SI" ]]; then echo 'No se autorizo entorno de ensayo' >&2; exit 2; fi
: "${DATABASE_URL:?Defina DATABASE_URL apuntando a PostgreSQL de ensayo, NO produccion}"
node scripts/verificar-paquete.mjs
npm install --no-audit --no-fund
npx --no-install prisma validate
npx --no-install prisma generate
npm test
npm run typecheck
npm run build
printf '\nOK: build local completo. Pendiente integracion y dispositivos reales de ensayo.\n'
