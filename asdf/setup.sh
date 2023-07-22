#!/usr/bin/env bash

############################################
# Prepare environment

curr_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$curr_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body


info "Installing asdf..."

git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.10.2


if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding asdf to .bashrc..."

    pushLineNonDup ". \$HOME/.asdf/asdf.sh" "$HOME/.bashrc"
    pushLineNonDup ". \$HOME/.asdf/completions/asdf.bash" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding asdf to .zshrc..."

    pushLineNonDup ". \$HOME/.asdf/asdf.sh" "$HOME/.zshrc"
    pushLineNonDup ". \$HOME/.asdf/completions/asdf.bash" "$HOME/.zshrc"
fi

. $HOME/.asdf/asdf.sh

. $HOME/.asdf/completions/asdf.bash


find * -name "*.sh" -not -path "setup.sh" | while read setup; do
    # NOTE: We cd back to make sure the directory is correct
    cd "$curr_dir"

    info "Running $setup..."

    . ./$setup
done
