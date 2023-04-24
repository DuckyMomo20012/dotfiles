#!/usr/bin/env bash

asdf_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$asdf_dir"

# NOTE: We have to cd first so we don't have to worry about relative path
# Load predefined functions
. ../utils/functions.sh

info "Installing asdf..."

git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.10.2


if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding asdf to .bashrc..."

    pushLineNonDup ". \$HOME/.asdf/asdf.sh" "$HOME/.bashrc"
    pushLineNonDup ". \$HOME/.asdf/completions/asdf.bash" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.bash_profile" ]]; then
    info "Adding asdf to .bash_profile..."

    pushLineNonDup ". \$HOME/.asdf/asdf.sh" "$HOME/.bash_profile"
    pushLineNonDup ". \$HOME/.asdf/completions/asdf.bash" "$HOME/.bash_profile"
fi

. $HOME/.asdf/asdf.sh

. $HOME/.asdf/completions/asdf.bash


find * -name "*.sh" -not -path "setup.sh" | while read setup; do
    # NOTE: We cd back to make sure the directory is correct
    cd "$asdf_dir"

    info "Running $setup..."

    . ./$setup
done
