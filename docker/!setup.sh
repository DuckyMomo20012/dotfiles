#!/usr/bin/env bash

crontab_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$crontab_dir"

# Load predefined functions
. ../utils/functions.sh

# Default values
default_action="K"

action="$default_action"

printUsage() {
    echo "Setup docker"
    echo ""
    echo "Usage: $(basename $0) [options]"
    echo "Options:"
    echo "  -k    Setup k3d kubernetes cluster"
    echo "  -h    Show help message"
}

while getopts ':bh' opt; do
  case "$opt" in
    k)
        action="K"
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

# Setup docker
info "Setup docker..."
. ./docker.setup.sh

if [[ "$action" == "K" ]]; then
    info "Setup \"k3d\" kubernetes cluster and \"kubectl\"..."
    . ./k3d.setup.sh

    . ./kubectl.setup.sh
fi
