#!/usr/bin/env bash

completion_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$completion_dir"

# Load predefined functions
. ../utils/functions.sh

if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding completion to .bashrc..."

    pushLineNonDup "source $completion_dir/npm.sh" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.bash_profile" ]]; then
    info "Adding completion to .bash_profile..."

    pushLineNonDup "source $completion_dir/npm.sh" "$HOME/.bash_profile"
fi
