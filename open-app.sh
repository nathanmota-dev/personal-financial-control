#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

APP_HOST="${HOST:-127.0.0.1}"
APP_PORT="${PORT:-3007}"
APP_URL="http://$APP_HOST:$APP_PORT"
STATE_DIR="$SCRIPT_DIR/.local/runtime"
SERVER_PID_FILE="$STATE_DIR/server.pid"
SERVER_LOG_FILE="$STATE_DIR/server.log"

mkdir -p "$STATE_DIR"

log() {
  printf '[open-app] %s\n' "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Erro: comando obrigatorio nao encontrado: %s\n' "$1" >&2
    exit 1
  fi
}

is_http_ready() {
  curl --silent --show-error --fail --max-time 2 "$APP_URL" >/dev/null 2>&1
}

has_running_pid() {
  if [[ ! -f "$SERVER_PID_FILE" ]]; then
    return 1
  fi

  local pid
  pid="$(<"$SERVER_PID_FILE")"

  [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1
}

wait_until_ready() {
  local attempt
  for attempt in $(seq 1 60); do
    if is_http_ready; then
      return 0
    fi
    sleep 1
  done

  return 1
}

require_command curl
require_command xdg-open

open_browser() {
  if [[ "${START_APP_SKIP_BROWSER:-0}" == "1" ]]; then
    log "Browser nao aberto porque START_APP_SKIP_BROWSER=1."
    return 0
  fi

  xdg-open "$APP_URL" >/dev/null 2>&1 &
}

if is_http_ready; then
  log "App ja esta respondendo em $APP_URL. Abrindo no navegador."
  open_browser
  exit 0
fi

if has_running_pid; then
  log "Servidor ja esta em execucao. Aguardando ficar disponivel."
else
  log "Subindo app local em background na porta $APP_PORT."
  START_APP_BACKGROUND=1 HOST="$APP_HOST" PORT="$APP_PORT" ./start-app.sh
fi

if wait_until_ready; then
  log "App pronto em $APP_URL. Abrindo no navegador."
  open_browser
  exit 0
fi

printf 'Erro: o app nao respondeu em %s.\n' "$APP_URL" >&2
printf 'Consulte o log em %s\n' "$SERVER_LOG_FILE" >&2
exit 1
