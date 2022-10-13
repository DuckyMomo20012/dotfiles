#!/usr/bin/env bash

gpg_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$gpg_dir"

# NOTE: We have to cd first so we don't have to worry about relative path
# Load predefined functions
. ../utils/crypto.sh

# Default values
default_backupFileName="secret.asc"

backupFileName="$default_backupFileName"

printUsage() {
    echo "Restore GPG keys"
    echo ""
    echo "Usage: $(basename $0) [options]"
    echo "Options:"
    echo "  -f <file>     Key file name to restore"
    echo "  -h            Show help message"
}

while getopts ':f:h' opt; do
  case "$opt" in
    f)
        backupFileName="${OPTARG}"
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

importKey "$backupFileName"
