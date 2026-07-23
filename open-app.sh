#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$SCRIPT_DIR"

ENV_BROWSER_BIN="${BROWSER_BIN-}"
if [[ -f "$SCRIPT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/.env"
  set +a
fi

if [[ -n "$ENV_BROWSER_BIN" ]]; then
  BROWSER_BIN="$ENV_BROWSER_BIN"
fi

APP_HOST="${HOST:-127.0.0.1}"
APP_PORT="${PORT:-3007}"
APP_URL="http://$APP_HOST:$APP_PORT"
STATE_DIR="$SCRIPT_DIR/.local/runtime"
LOCK_FILE="$STATE_DIR/open-app.lock"
SESSION_FILE="$STATE_DIR/app.session"
SERVER_PID_FILE="$STATE_DIR/server.pid"
SERVER_SESSION_FILE="$STATE_DIR/server-session.txt"
SERVER_LOG_FILE="$STATE_DIR/server.log"
BROWSER_PID_FILE="$STATE_DIR/browser.pid"
WINDOW_CLASS="personal-financial-control"
BROWSER_BIN="${BROWSER_BIN:-}"
BROWSER_PROFILE_DIR="${BROWSER_PROFILE_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/personal-financial-control/browser-profile}"
SESSION_ID=""
OWNS_SERVER=0
SERVER_STARTED=0

mkdir -p "$STATE_DIR"

if [[ -z "$BROWSER_BIN" && -n "${BRAVE_BIN:-}" ]]; then
  BROWSER_BIN="$BRAVE_BIN"
fi

if [[ -z "$BROWSER_BIN" ]]; then
  if command -v brave >/dev/null 2>&1; then
    BROWSER_BIN="brave"
  elif command -v brave-browser >/dev/null 2>&1; then
    BROWSER_BIN="brave-browser"
  elif command -v google-chrome >/dev/null 2>&1; then
    BROWSER_BIN="google-chrome"
  elif command -v google-chrome-stable >/dev/null 2>&1; then
    BROWSER_BIN="google-chrome-stable"
  elif command -v chromium >/dev/null 2>&1; then
    BROWSER_BIN="chromium"
  elif command -v chromium-browser >/dev/null 2>&1; then
    BROWSER_BIN="chromium-browser"
  fi
fi

log() {
  printf '[open-app] %s\n' "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Erro: comando obrigatorio nao encontrado: %s\n' "$1" >&2
    exit 1
  fi
}

read_file() {
  if [[ -f "$1" ]]; then
    printf '%s' "$(<"$1")"
  fi
}

is_pid_running() {
  local pid="${1:-}"
  [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1
}

server_pid() {
  read_file "$SERVER_PID_FILE"
}

server_session_id() {
  read_file "$SERVER_SESSION_FILE"
}

browser_pid() {
  read_file "$BROWSER_PID_FILE"
}

current_session_id() {
  read_file "$SESSION_FILE"
}

is_http_ready() {
  curl --silent --show-error --fail --max-time 2 "$APP_URL" >/dev/null 2>&1
}

clear_runtime_state() {
  rm -f "$SESSION_FILE" "$SERVER_PID_FILE" "$SERVER_SESSION_FILE" "$BROWSER_PID_FILE"
}

stop_server_pid() {
  local pid="${1:-}"
  local attempt

  if ! is_pid_running "$pid"; then
    return 0
  fi

  kill "$pid" >/dev/null 2>&1 || true

  for attempt in $(seq 1 10); do
    if ! is_pid_running "$pid"; then
      return 0
    fi
    sleep 1
  done

  kill -9 "$pid" >/dev/null 2>&1 || true
}

port_listener_pid() {
  lsof -tiTCP:"$APP_PORT" -sTCP:LISTEN 2>/dev/null | head -n 1 || true
}

find_browser_pid() {
  pgrep -f -- "--user-data-dir=$BROWSER_PROFILE_DIR" | head -n 1 || true
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

wait_for_browser_start() {
  local attempt
  local pid

  for attempt in $(seq 1 20); do
    pid="$(find_browser_pid)"
    if is_pid_running "$pid"; then
      printf '%s\n' "$pid"
      return 0
    fi
    sleep 1
  done

  return 1
}

cleanup_stale_state() {
  local stale_server_pid stale_browser_pid

  stale_server_pid="$(server_pid)"
  stale_browser_pid="$(browser_pid)"

  if is_pid_running "$stale_server_pid" && ! is_pid_running "$stale_browser_pid"; then
    log "Sessao anterior sem janela ativa encontrada. Encerrando servidor stale."
    stop_server_pid "$stale_server_pid"
  fi

  if ! is_pid_running "$stale_browser_pid"; then
    clear_runtime_state
  fi
}

ensure_port_available() {
  local listener_pid managed_server_pid

  listener_pid="$(port_listener_pid)"
  if [[ -z "$listener_pid" ]]; then
    return 0
  fi

  managed_server_pid="$(server_pid)"
  if [[ -n "$managed_server_pid" && "$listener_pid" == "$managed_server_pid" ]]; then
    return 0
  fi

  printf 'Erro: a porta %s ja esta em uso por um processo externo (PID %s).\n' "$APP_PORT" "$listener_pid" >&2
  exit 1
}

cleanup_on_exit() {
  local exit_code=$?
  local pid

  if [[ "$SERVER_STARTED" == "1" && "$OWNS_SERVER" == "1" ]]; then
    pid="$(server_pid)"
    stop_server_pid "$pid"
  fi

  if [[ "$OWNS_SERVER" == "1" ]]; then
    clear_runtime_state
  fi

  exit "$exit_code"
}

is_active_session() {
  local active_session active_browser active_server

  active_session="$(current_session_id)"
  active_browser="$(browser_pid)"
  active_server="$(server_pid)"

  [[ -n "$active_session" ]] && is_pid_running "$active_browser" && is_pid_running "$active_server"
}

start_server() {
  log "Subindo app local em background na porta $APP_PORT."
  START_APP_BACKGROUND=1 START_APP_SESSION_ID="$SESSION_ID" HOST="$APP_HOST" PORT="$APP_PORT" ./start-app.sh
  OWNS_SERVER=1
  SERVER_STARTED=1
}

launch_browser() {
  if [[ "${START_APP_SKIP_BROWSER:-0}" == "1" ]]; then
    log "Browser nao aberto porque START_APP_SKIP_BROWSER=1."
    return 0
  fi

  mkdir -p "$BROWSER_PROFILE_DIR"

  "$BROWSER_BIN" \
    --app="$APP_URL" \
    --new-window \
    --start-maximized \
    --user-data-dir="$BROWSER_PROFILE_DIR" \
    --class="$WINDOW_CLASS" \
    --disable-background-mode \
    --no-first-run \
    --no-default-browser-check \
    >/dev/null 2>&1 &
}

monitor_browser_lifecycle() {
  local pid
  pid="$(wait_for_browser_start)"
  printf '%s\n' "$pid" > "$BROWSER_PID_FILE"
  log "App aberto no navegador $BROWSER_BIN com PID $pid."

  while is_pid_running "$(find_browser_pid)"; do
    sleep 1
  done
}

require_command curl
require_command flock
require_command lsof
require_command pgrep

if [[ -z "$BROWSER_BIN" ]]; then
  printf 'Erro: navegador nao encontrado. Instale o Brave/Chrome ou defina BROWSER_BIN.\n' >&2
  exit 1
fi

require_command "$BROWSER_BIN"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Launcher ja esta em execucao. Ignorando novo clique."
  exit 0
fi

trap cleanup_on_exit EXIT INT TERM

cleanup_stale_state

if is_active_session; then
  log "App ja esta aberto. Nenhuma nova janela sera criada."
  exit 0
fi

ensure_port_available

SESSION_ID="session-$$-$(date +%s)"
printf '%s\n' "$SESSION_ID" > "$SESSION_FILE"

if ! is_http_ready; then
  start_server
fi

if wait_until_ready; then
  if [[ "${START_APP_SKIP_BROWSER:-0}" == "1" ]]; then
    log "App pronto em $APP_URL. Encerrando apos validacao sem abrir janela."
    exit 0
  fi

  launch_browser
  monitor_browser_lifecycle
  exit 0
fi

printf 'Erro: o app nao respondeu em %s.\n' "$APP_URL" >&2
printf 'Consulte o log em %s\n' "$SERVER_LOG_FILE" >&2
exit 1
