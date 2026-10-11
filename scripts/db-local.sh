#!/usr/bin/env bash
# PostgreSQL local sans Docker (utile en CI ou sur une machine sans Docker).
# Usage : bash scripts/db-local.sh start|stop
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$ROOT/.pgdata"
PORT=5433
BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
[ -n "$BIN" ] || BIN="$(dirname "$(command -v pg_ctl)")"

as_pg() { if [ "$(id -u)" = "0" ]; then runuser -u postgres -- "$@"; else "$@"; fi; }

case "${1:-start}" in
  start)
    if [ ! -d "$DATA" ]; then
      mkdir -p "$DATA"; [ "$(id -u)" = "0" ] && chown postgres "$DATA"
      as_pg "$BIN/initdb" -D "$DATA" -U postgres --auth=trust >/dev/null
    fi
    as_pg "$BIN/pg_ctl" -D "$DATA" -o "-p $PORT -k /tmp" -l "$DATA/server.log" start >/dev/null
    sleep 1
    psql -h /tmp -p $PORT -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='educationplus'" | grep -q 1 || \
      psql -h /tmp -p $PORT -U postgres -c "CREATE ROLE educationplus LOGIN PASSWORD 'educationplus' CREATEDB" >/dev/null
    psql -h /tmp -p $PORT -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='educationplus'" | grep -q 1 || \
      psql -h /tmp -p $PORT -U postgres -c "CREATE DATABASE educationplus OWNER educationplus" >/dev/null
    echo "PostgreSQL prêt sur le port $PORT"
    ;;
  stop)
    as_pg "$BIN/pg_ctl" -D "$DATA" stop >/dev/null && echo "PostgreSQL arrêté"
    ;;
esac
