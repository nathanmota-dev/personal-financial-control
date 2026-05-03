#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

APP_HOST="${HOST:-127.0.0.1}"
APP_PORT="${PORT:-3007}"
STATE_DIR="$SCRIPT_DIR/.local/runtime"
BUILD_FINGERPRINT_FILE="$STATE_DIR/build-fingerprint.txt"
SERVER_PID_FILE="$STATE_DIR/server.pid"
SERVER_LOG_FILE="$STATE_DIR/server.log"

mkdir -p "$STATE_DIR"

log() {
  printf '[start-app] %s\n' "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Erro: comando obrigatorio nao encontrado: %s\n' "$1" >&2
    exit 1
  fi
}

compute_build_fingerprint() {
  local files=(
    package.json
    package-lock.json
    next.config.ts
    tsconfig.json
    postcss.config.mjs
    eslint.config.mjs
    components.json
  )
  local dirs=(
    app
    components
    drizzle
    hooks
    lib
    public
    scripts
  )
  local hasher_input=()
  local dir
  local file

  for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
      hasher_input+=("$file")
    fi
  done

  for dir in "${dirs[@]}"; do
    if [[ -d "$dir" ]]; then
      while IFS= read -r -d '' file; do
        hasher_input+=("$file")
      done < <(find "$dir" -type f -print0 | sort -z)
    fi
  done

  if [[ "${#hasher_input[@]}" -eq 0 ]]; then
    printf 'empty\n'
    return
  fi

  sha256sum "${hasher_input[@]}" | sha256sum | awk '{ print $1 }'
}

require_command npm
require_command sha256sum
require_command awk
require_command find
require_command sort

if [[ ! -d node_modules ]]; then
  log "Dependencias nao encontradas. Rodando npm install."
  npm install
fi

CURRENT_FINGERPRINT="$(compute_build_fingerprint)"
SAVED_FINGERPRINT=""

if [[ -f "$BUILD_FINGERPRINT_FILE" ]]; then
  SAVED_FINGERPRINT="$(<"$BUILD_FINGERPRINT_FILE")"
fi

if [[ ! -f .next/BUILD_ID || "$CURRENT_FINGERPRINT" != "$SAVED_FINGERPRINT" ]]; then
  log "Alteracoes detectadas ou build ausente. Rodando npm run build."
  npm run build
  printf '%s\n' "$CURRENT_FINGERPRINT" > "$BUILD_FINGERPRINT_FILE"
else
  log "Build reaproveitado. Nenhuma mudanca relevante detectada."
fi

log "Aplicando migracoes locais."
npm run db:migrate

if [[ "${START_APP_SKIP_SERVER:-0}" == "1" ]]; then
  log "Validacao concluida. Servidor nao iniciado porque START_APP_SKIP_SERVER=1."
  exit 0
fi

log "Iniciando app em http://$APP_HOST:$APP_PORT."

if [[ "${START_APP_BACKGROUND:-0}" == "1" ]]; then
  : > "$SERVER_LOG_FILE"
  nohup env HOST="$APP_HOST" PORT="$APP_PORT" npm start >>"$SERVER_LOG_FILE" 2>&1 &
  SERVER_PID=$!
  printf '%s\n' "$SERVER_PID" > "$SERVER_PID_FILE"
  log "Servidor iniciado em background com PID $SERVER_PID. Log: $SERVER_LOG_FILE"
  exit 0
fi

HOST="$APP_HOST" PORT="$APP_PORT" npm start
