#!/usr/bin/env bash

############################################
# Prepare environment

crontab_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$crontab_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body


# Default values
default_action="B"
default_backupFile="$crontab_dir/crontab.bak"

action="$default_action"

printUsage() {
    echo "Add crontab jobs"
    echo ""
    echo "Usage: $(basename $0) [options]"
    echo "Options:"
    echo "  -b    Backup old cronjobs before updating"
    echo "  -h    Show help message"
}

while getopts ':bh' opt; do
  case "$opt" in
    b)
        action="B"
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

if [[ "$action" == "B" ]]; then
    info "Backing up current crontab..."
    . ./export.sh -f "$default_backupFile"

    if [[ -f "$default_backupFile" && ! -s "$default_backupFile"  ]]; then
        info "File $default_backupFile is empty, no crontab jobs to backup, removing file..."
        rm -rf "$default_backupFile"
    fi
fi

# Export current crontab to temporary file to append new jobs
. ./export.sh

# Add crontab jobs here

. ./import.sh

# Remove temporary file
rm -rf "$crontab_dir/crontab.txt"
