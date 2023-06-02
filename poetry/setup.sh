#!/usr/bin/env bash

poetry_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$poetry_dir"

# Load predefined functions
. ../utils/functions.sh

info "Installing Poetry..."

curl -sSL https://install.python-poetry.org | python3 -

if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding poetry to .bashrc..."

    pushLineNonDup "export PATH=\$HOME/.local/bin:\$PATH" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding poetry to .zshrc..."

    pushLineNonDup "export PATH=\$HOME/.local/bin:\$PATH" "$HOME/.zshrc"
fi
