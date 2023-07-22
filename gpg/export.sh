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
default_email="tienvinh.duong4@gmail.com"
default_backupFileName="secret.asc"

email="$default_email"
backupFileName="$default_backupFileName"

printUsage() {
    echo "Backup GPG keys"
    echo ""
    echo "Usage: $(basename $0) [options]"
    echo "Options:"
    echo "  -e <email>    Email address"
    echo "  -f <file>     Backup file name"
    echo "  -h            Show help message"
}

while getopts ':e:f:h' opt; do
  case "$opt" in
    e)
        email="${OPTARG}"
        ;;

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

exportSecretKey "$email" "$backupFileName"
