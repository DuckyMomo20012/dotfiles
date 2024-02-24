#!/usr/bin/env bash

############################################
# Prepare environment

poetry_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$poetry_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body


info "Installing Poetry..."

curl -sSL https://install.python-poetry.org | python3 -

if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding poetry to .bashrc..."

    pushUniqueLine "export PATH=\$HOME/.local/bin:\$PATH" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding poetry to .zshrc..."

    pushUniqueLine "export PATH=\$HOME/.local/bin:\$PATH" "$HOME/.zshrc"
fi
