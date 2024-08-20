#!/usr/bin/env bash

############################################
# Prepare environment

completion_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$completion_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body


if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding completion to .bashrc..."

    pushUniqueLine "source $completion_dir/npm.sh" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding completion to .zshrc..."

    pushUniqueLine "source $completion_dir/npm.sh" "$HOME/.zshrc"
fi
