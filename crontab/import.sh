#!/usr/bin/env bash

crontab_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$crontab_dir"

# Default values
default_src="crontab.txt"

src="$default_src"

printUsage() {
    echo "Import crontab from file"
    echo ""
    echo "Usage: $(basename $0) [options]"
    echo "Options:"
    echo "  -f <path>    Source file"
    echo "  -h           Show help message"
}

while getopts ':f:h' opt; do
  case "$opt" in
    f)
        src="${OPTARG}"
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

crontab "$src"
