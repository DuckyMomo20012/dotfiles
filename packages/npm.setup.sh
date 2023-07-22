#!/usr/bin/env bash

packages_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$packages_dir"

# Load predefined functions
. ../utils/functions.sh

mkdir -p "$HOME/.npm-global"

# NOTE: We don't use command to set config because npm is not installed yet
pushLineNonDup "prefix=\${HOME}/.npm-global" "$HOME/.npmrc"

if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding .npm-global to .bashrc..."

    pushLineNonDup "export PATH=\$HOME/.npm-global/bin:\$PATH" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding .npm-global to .zshrc..."

    pushLineNonDup "export PATH=\$HOME/.npm-global/bin:\$PATH" "$HOME/.zshrc"
fi
