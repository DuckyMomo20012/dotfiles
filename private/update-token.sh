#!/usr/bin/env bash
#
# Update the GitHub token stored in the private dotfiles.

set -Eeuo pipefail

############################################
# Prepare environment

private_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$private_dir"

############################################
# Script body

new_token=""
backup_ext=""

print_usage() {
  echo "Update GitHub token"
  echo ""
  echo "Usage: $(basename "$0") [options]"
  echo "Options:"
  echo "  -t <token>    New token"
  echo "  -b            Backup old file before updating"
  echo "  -h            Show help message"
}

while getopts ':t:bh' opt; do
  case "$opt" in
    t)
      # NOTE: We strip the leading ghp_ from the new token and add it back
      # later
      new_token="${OPTARG#ghp_}"
      ;;

    b)
      # Backup file with filename.bak
      backup_ext=".bak"
      ;;

    h)
      print_usage
      exit 0
      ;;

    :)
      echo -e "$0: option requires an argument.\n" >&2
      print_usage >&2
      exit 1
      ;;

    ?)
      echo -e "$0: illegal option.\n" >&2
      print_usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$new_token" ]]; then
  echo "Please provide new token" >&2
  exit 1
fi

credentials="$private_dir/dotfiles/.git-credentials"
gitconfig_local="$private_dir/dotfiles/.gitconfig.local"

for file in "$credentials" "$gitconfig_local"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing file: $file" >&2
    exit 1
  fi
done

# Github token will have ghp_ prefix. Running this again with the same token
# changes nothing.
sed -i"$backup_ext" "s/\(ghp_\)\{0,1\}\w\+@/ghp_$new_token@/" "$credentials"

sed -i"$backup_ext" "s/\(ghp_\)\{0,1\}\w\{36\}/$new_token/" "$gitconfig_local"
