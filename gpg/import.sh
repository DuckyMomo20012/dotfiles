#!/usr/bin/env bash

############################################
# Prepare environment

curr_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$curr_dir"

# Load predefined functions
. ../utils/crypto.sh

############################################
# Script body


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
