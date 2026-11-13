#!/usr/bin/env bash

# Copies everything git ignores in the main worktree (node_modules, .env,
# reports, test-results, ...) into another worktree of the same repository.
# Paths that already exist in the target are kept untouched.

set -euo pipefail

# Runtime state owned by one checkout (pid, locks, logs); the launcher recreates it.
EXCLUDED_PATHS=(".local/runtime")

CURRENT_TEMP=""
trap '[[ -z "$CURRENT_TEMP" ]] || rm -rf -- "$CURRENT_TEMP"' EXIT

log() {
  printf '[copy-ignored] %s\n' "$1"
}

fail() {
  printf 'Erro: %s\n' "$1" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Uso: ./scripts/copy-ignored-to-worktree.sh [caminho-da-worktree]

Copia para a worktree tudo que o git ignora na worktree principal.
Sem argumento, usa a worktree do diretorio atual como destino.
EOF
}

# True when the ignored path is, contains, or sits inside a linked worktree.
overlaps_worktree() {
  local candidate="$SOURCE_ROOT/$1" worktree
  for worktree in "${WORKTREES[@]:1}"; do
    if [[ "$worktree" == "$candidate" || "$worktree" == "$candidate"/* || "$candidate" == "$worktree"/* ]]; then
      return 0
    fi
  done
  return 1
}

remove_excluded_paths() {
  local relative="$1" copied_root="$2" excluded
  for excluded in "${EXCLUDED_PATHS[@]}"; do
    if [[ "$excluded" == "$relative"/* ]]; then
      rm -rf -- "${copied_root:?}/${excluded#"$relative"/}"
    fi
  done
}

copy_entry() {
  local relative="$1"
  local source_path="$SOURCE_ROOT/$relative"
  local target_path="$TARGET_ROOT/$relative"

  mkdir -p -- "$(dirname -- "$target_path")"

  # Copy under a temporary name so an interrupted run is never mistaken for a
  # finished copy by the "already exists" check on the next run.
  CURRENT_TEMP="$target_path.copying.$$"
  cp -a --reflink=auto -- "$source_path" "$CURRENT_TEMP" || return 1
  remove_excluded_paths "$relative" "$CURRENT_TEMP"
  mv -T -- "$CURRENT_TEMP" "$target_path" || return 1
  CURRENT_TEMP=""
}

case "${1:-}" in
  -h | --help)
    usage
    exit 0
    ;;
esac

if [[ $# -gt 1 ]]; then
  usage >&2
  exit 1
fi

TARGET_INPUT="${1:-$PWD}"
[[ -d "$TARGET_INPUT" ]] || fail "diretorio nao encontrado: $TARGET_INPUT"
TARGET_ROOT="$(git -C "$TARGET_INPUT" rev-parse --show-toplevel 2>/dev/null)" ||
  fail "nao e uma worktree git: $TARGET_INPUT"

# Git always lists the main worktree first.
mapfile -t WORKTREES < <(git -C "$TARGET_ROOT" worktree list --porcelain | sed -n 's/^worktree //p')
SOURCE_ROOT="${WORKTREES[0]}"

if [[ "$TARGET_ROOT" == "$SOURCE_ROOT" ]]; then
  usage >&2
  fail "o destino e a propria worktree principal; informe a worktree nova"
fi

log "origem:  $SOURCE_ROOT"
log "destino: $TARGET_ROOT"

copied=0
skipped=0
failed=0

while IFS= read -r -d '' entry; do
  relative="${entry%/}"

  if overlaps_worktree "$relative"; then
    log "ignorando (contem worktree): $relative"
    continue
  fi

  if [[ -e "$TARGET_ROOT/$relative" || -L "$TARGET_ROOT/$relative" ]]; then
    log "ja existe, mantendo: $relative"
    skipped=$((skipped + 1))
    continue
  fi

  log "copiando: $relative"
  if copy_entry "$relative"; then
    copied=$((copied + 1))
  else
    printf 'Erro: falha ao copiar %s\n' "$relative" >&2
    rm -rf -- "$CURRENT_TEMP"
    CURRENT_TEMP=""
    failed=$((failed + 1))
  fi
done < <(git -C "$SOURCE_ROOT" ls-files --others --ignored --exclude-standard --directory -z)

log "concluido: $copied copiados, $skipped mantidos, $failed com falha"
[[ "$failed" -eq 0 ]]
