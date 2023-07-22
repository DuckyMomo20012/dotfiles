#!/usr/bin/env bash

############################################
# Prepare environment

curr_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$curr_dir"

############################################
# Script body


# Load predefined functions
. ../utils/functions.sh

if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding completion to .bashrc..."

    pushLineNonDup "source $curr_dir/npm.sh" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding completion to .zshrc..."

    pushLineNonDup "source $curr_dir/npm.sh" "$HOME/.zshrc"
fi
