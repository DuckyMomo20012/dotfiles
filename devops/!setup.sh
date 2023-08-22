#!/usr/bin/env bash

############################################
# Prepare environment

devops_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$devops_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body


# Install tools
find * -name "*.sh" -not \( -path "setup.sh" -o -path "!setup.sh" \) | while read setup; do
    # NOTE: We cd back to make sure the directory is correct
    cd "$curr_dir"

    info "Running $setup..."

    . ./$setup
done
