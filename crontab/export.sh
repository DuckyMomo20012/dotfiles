#!/usr/bin/env bash

############################################
# Prepare environment

crontab_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$crontab_dir"

############################################
# Script body


# Default values
default_dst="crontab.txt"

dst="$default_dst"

printUsage() {
    echo "Export crontab to file"
    echo ""
    echo "Usage: $(basename $0) [options]"
    echo "Options:"
    echo "  -f <path>    Destination file"
    echo "  -h           Show help message"
}

while getopts ':f:h' opt; do
  case "$opt" in
    f)
        dst="${OPTARG}"
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

crontab -l > "$dst"
