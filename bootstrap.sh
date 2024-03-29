#!/usr/bin/env bash

############################################
# Prepare environment

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$project_dir"

# Load predefined functions
. ./utils/functions.sh

############################################
# Script body


info "Prompt for sudo password..."

startsudo

if [[ $? == 0 ]]; then
    # Whatever you want to do with sudo
    sudo apt-get update

    # Package control must be executed first in order for the rest to work
    . ./packages/setup.sh

    cd "$project_dir"
    find * -name "setup.sh" -not -path "packages*" | while read setup; do
        # NOTE: We have to cd back to maintain relative path
        cd "$project_dir"

        . ./$setup
    done
fi

info "Invoking sudo privilege..."

stopsudo
