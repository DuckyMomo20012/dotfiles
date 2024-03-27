#!/usr/bin/env bash

############################################
# Prepare environment

asdf_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$asdf_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body


info "Installing asdf..."

git clone https://github.com/asdf-vm/asdf.git ~/.asdf


if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding asdf to .bashrc..."

    pushUniqueLine ". \$HOME/.asdf/asdf.sh" "$HOME/.bashrc"
    pushUniqueLine ". \$HOME/.asdf/completions/asdf.bash" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding asdf to .zshrc..."

    pushUniqueLine ". \$HOME/.asdf/asdf.sh" "$HOME/.zshrc"
    pushUniqueLine ". \$HOME/.asdf/completions/asdf.bash" "$HOME/.zshrc"
fi

. $HOME/.asdf/asdf.sh

. $HOME/.asdf/completions/asdf.bash


find * -name "*.sh" -not -path "setup.sh" | while read setup; do
    # NOTE: We cd back to make sure the directory is correct
    cd "$asdf_dir"

    info "Running $setup..."

    . ./$setup
done
