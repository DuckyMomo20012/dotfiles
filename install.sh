#!/usr/bin/env bash
#
# Install these dotfiles on a (fresh) machine. Safe to run again and again.
#
#   curl -fsSL https://raw.githubusercontent.com/DuckyMomo20012/dotfiles/main/install.sh | bash -s -- [bootstrap options]
#
# Every argument is passed to `bun bootstrap.ts`, e.g. `--dry-run`, `--no-backup`,
# `--dedot --secret secret.asc --email me@example.com`. See `bun bootstrap.ts --help`.
#
# Environment:
#   DOTFILES_REPO    git URL to clone   (default: https://github.com/DuckyMomo20012/dotfiles.git)
#   DOTFILES_DIR     where to clone     (default: $HOME/dotfiles)
#   DOTFILES_BRANCH  branch to check out (default: the repository default)

set -Eeuo pipefail

REPO_URL="${DOTFILES_REPO:-https://github.com/DuckyMomo20012/dotfiles.git}"
DOTFILES_DIR="${DOTFILES_DIR:-$HOME/dotfiles}"
DOTFILES_BRANCH="${DOTFILES_BRANCH:-}"

log() { printf '\033[36m%s\033[0m\n' "$*"; }
die() { printf '\033[31;1m%s\033[0m\n' "$*" >&2; exit 1; }

trap 'die "install.sh failed on line $LINENO"' ERR

SUDO=""
if [[ "${EUID}" -ne 0 ]]; then
  command -v sudo >/dev/null 2>&1 || die "sudo is required when not running as root."
  SUDO="sudo"
fi

# Dry run: do not install anything, just let bootstrap.ts describe its plan.
DRY_RUN=0
for arg in "$@"; do
  [[ "$arg" == "--dry-run" || "$arg" == "-n" ]] && DRY_RUN=1
done

# 1. Tools needed to fetch the repository and bun (`unzip` is needed by bun's installer).
missing=()
for tool in curl git unzip; do
  command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
done

if ((${#missing[@]} > 0)); then
  if ((DRY_RUN)); then
    log "[dry-run] would install: ${missing[*]}"
  elif command -v apt-get >/dev/null 2>&1; then
    log "Installing ${missing[*]}..."
    $SUDO apt-get update
    $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates "${missing[@]}"
  else
    die "Please install: ${missing[*]}"
  fi
fi

# 2. Get the repository: clone it, or fast-forward an existing clone.
if [[ -d "$DOTFILES_DIR/.git" ]]; then
  log "Updating $DOTFILES_DIR..."
  git -C "$DOTFILES_DIR" pull --ff-only || log "Could not fast-forward $DOTFILES_DIR (local changes?), using it as it is."
elif [[ -e "$DOTFILES_DIR" && -n "$(ls -A "$DOTFILES_DIR" 2>/dev/null)" ]]; then
  die "$DOTFILES_DIR exists and is not a git repository. Move it away or set DOTFILES_DIR."
elif ((DRY_RUN)); then
  log "[dry-run] would clone $REPO_URL to $DOTFILES_DIR"
  exit 0
else
  log "Cloning $REPO_URL to $DOTFILES_DIR..."
  # shellcheck disable=SC2086 # the branch flag must split into two words (or none)
  git clone ${DOTFILES_BRANCH:+--branch "$DOTFILES_BRANCH"} "$REPO_URL" "$DOTFILES_DIR"
fi

cd "$DOTFILES_DIR"

# 3. bun runs every script of this repository.
export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"

if ! command -v bun >/dev/null 2>&1; then
  if ((DRY_RUN)); then
    log "[dry-run] would install bun"
    exit 0
  fi
  log "Installing bun..."
  curl -fsSL https://bun.com/install | bash
fi

# 4. Run the bootstrap. When this script is piped into bash, stdin is the
#    pipe, so give bootstrap.ts the terminal (it asks questions and sudo prompts).
log "Running bootstrap..."
if [[ ! -t 0 && -r /dev/tty ]]; then
  bun bootstrap.ts "$@" </dev/tty
else
  bun bootstrap.ts "$@"
fi
