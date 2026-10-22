#!/usr/bin/env bash
#
# Fresh machine wrapper. Put this next to your private files and run it:
#
#   .
#   ├── bootstrap.sh
#   ├── secret.asc        (GPG secret key, optional)
#   └── *.deb             (packages to install first, optional, e.g. VS Code)
#
#   ./bootstrap.sh [--dry-run] [--no-backup] [--force] [any `bun bootstrap.ts` option]
#
# Every option goes to `install.sh` / `bun bootstrap.ts`. `--dry-run` and
# `--no-backup` are also applied to the GPG steps run here.
#
# Environment (all optional):
#   GPG_EMAIL        email of your GPG key (used to skip the import when it is already there)
#   GPG_PASSPHRASE   passphrase of encrypted.tar.gz.gpg; without it gpg asks for it
#   DOTFILES_DIR     where the dotfiles live (default: $HOME/dotfiles)
#   INSTALL_URL      where to get install.sh from
#
# Safe to run again and again.

set -Eeuo pipefail

curr_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOTFILES_DIR="${DOTFILES_DIR:-$HOME/dotfiles}"
INSTALL_URL="${INSTALL_URL:-https://raw.githubusercontent.com/DuckyMomo20012/dotfiles/main/install.sh}"
BUN="${BUN_INSTALL:-$HOME/.bun}/bin/bun"
SECRET_FILE="${GPG_SECRET_FILE:-$curr_dir/secret.asc}"

log() { printf '\033[36m%s\033[0m\n' "$*"; }
warn() { printf '\033[33m%s\033[0m\n' "$*" >&2; }

trap 'printf "\033[31;1mbootstrap.sh failed on line %s\033[0m\n" "$LINENO" >&2' ERR

# Options that must also reach the GPG steps below.
dry_run=0
gpg_flags=()
for arg in "$@"; do
  case "$arg" in
    --dry-run | -n) dry_run=1; gpg_flags+=(--dry-run) ;;
    --no-backup) gpg_flags+=(--no-backup) ;;
    --force) gpg_flags+=(--force) ;;
  esac
done

# Print the command in dry-run mode, run it otherwise.
run() {
  if ((dry_run)); then
    printf '[dry-run] '
    printf '%q ' "$@"
    printf '\n'
  else
    "$@"
  fi
}

SUDO=""
[[ "${EUID}" -ne 0 ]] && SUDO="sudo"

# 1. Local .deb packages (e.g. VS Code). apt cannot read files inside a
#    private home directory (it runs as the _apt user), so stage them in /tmp.
shopt -s nullglob
debs=("$curr_dir"/*.deb)
shopt -u nullglob

if ((${#debs[@]} > 0)); then
  stage="$(mktemp -d /tmp/dotfiles-packages.XXXXXX)"
  trap 'rm -rf "$stage"' EXIT
  chmod 755 "$stage"

  # Let the VS Code package add its apt repository without asking.
  run bash -c 'echo "code code/add-microsoft-repo boolean true" | '"$SUDO"' debconf-set-selections'

  for deb in "${debs[@]}"; do
    cp "$deb" "$stage/"
    log "Installing $(basename "$deb")..."
    # shellcheck disable=SC2086 # $SUDO is empty for root and must not become an empty argument
    run $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y "$stage/$(basename "$deb")"
  done
fi

# 2. Everything else, including `bun` and the dotfiles themselves.
if command -v apt-get >/dev/null 2>&1; then
  # shellcheck disable=SC2086
  run $SUDO apt-get install -y curl git
fi

log "Running install.sh..."
if ((dry_run)); then
  log "[dry-run] would run: curl -fsSL $INSTALL_URL | bash -s -- $*"
else
  curl -fsSL "$INSTALL_URL" | bash -s -- "$@"
fi

# 3. GPG key and private files.
if [[ -f "$SECRET_FILE" ]]; then
  # shellcheck disable=SC2086 # the email flag must split into two words (or none)
  run "$BUN" "$DOTFILES_DIR/gpg/import.ts" -f "$SECRET_FILE" ${GPG_EMAIL:+-e "$GPG_EMAIL"} "${gpg_flags[@]}"
else
  warn "No GPG secret file at $SECRET_FILE, skipping key import and private files."
  exit 0
fi

# Without GPG_PASSPHRASE, gpg prompts for it.
run "$BUN" "$DOTFILES_DIR/gpg/dedot.ts" "${gpg_flags[@]}"
