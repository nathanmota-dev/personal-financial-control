#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
APPLICATIONS_DIR="$DATA_HOME/applications"
DESKTOP_SOURCE="$SCRIPT_DIR/personal-financial-control.desktop"
DESKTOP_TARGET="$APPLICATIONS_DIR/personal-financial-control.desktop"
APP_EXEC="$SCRIPT_DIR/open-app.sh"
APP_ICON="$SCRIPT_DIR/app/icon.png"

log() {
  printf '[install-app] %s\n' "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Erro: comando obrigatorio nao encontrado: %s\n' "$1" >&2
    exit 1
  fi
}

require_file() {
  if [[ ! -f "$1" ]]; then
    printf 'Erro: arquivo obrigatorio nao encontrado: %s\n' "$1" >&2
    exit 1
  fi
}

quote_exec_path() {
  local value="$1"

  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//\$/\\\$}"
  value="${value//\`/\\\`}"
  printf '"%s"' "$value"
}

require_command desktop-file-install
require_command desktop-file-validate
require_file "$DESKTOP_SOURCE"
require_file "$APP_EXEC"
require_file "$APP_ICON"

mkdir -p "$APPLICATIONS_DIR"

desktop-file-install \
  --dir="$APPLICATIONS_DIR" \
  --mode=0755 \
  --set-key=Exec \
  --set-value="$(quote_exec_path "$APP_EXEC")" \
  --set-key=Path \
  --set-value="$SCRIPT_DIR" \
  --set-icon="$APP_ICON" \
  "$DESKTOP_SOURCE"

desktop-file-validate "$DESKTOP_TARGET"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APPLICATIONS_DIR"
fi

log "Launcher instalado em $DESKTOP_TARGET."
log "Procure por Finance no menu de aplicativos."
