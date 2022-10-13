#!/usr/bin/env bash

crontab_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$crontab_dir"

# Load predefined functions
. ../utils/functions.sh

# Default values
default_action="B"

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
        acion="B"
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
    . ./export.sh -f "$crontab_dir/crontab.bak"
fi

# Export current crontab to temporary file to append new jobs
. ./export.sh

pushLineNonDup "0 */12 */5 * * $crontab_dir/check-version/script.sh" "$crontab_dir/crontab.txt"

. ./import.sh

# Remove temporary file
rm -rf "$crontab_dir/crontab.txt"
