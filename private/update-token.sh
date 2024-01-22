#!/usr/bin/env bash

############################################
# Prepare environment

private_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$private_dir"

############################################
# Script body


new_token=""

printUsage() {
    echo "Update GitHub token"
    echo ""
    echo "Usage: $(basename $0) [options]"
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
        backupExt=".bak"
        ;;

    h)
        printUsage
        exit 0
        ;;

    :)
        echo -e "$0: option requires an argument.\n"
        printUsage
        exit 1
        ;;

    ?)
        echo -e "$0: illegal option.\n"
        printUsage
        exit 1
        ;;
  esac
done

if [[ -z "$new_token" ]]; then
    echo "Please provide new token"
    exit 1
fi

# Github token will have ghp_ prefix
sed -i"$backupExt" "s/\(ghp_\)\{0,1\}\w\+@/ghp_$new_token@/" "$private_dir/dotfiles/.git-credentials"

sed -i"$backupExt" "s/\(ghp_\)\{0,1\}\w\{36\}/$new_token/" "$private_dir/dotfiles/.gitconfig.local"
