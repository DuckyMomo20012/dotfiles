#!/usr/bin/env bash

############################################
# Prepare environment

brew_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$brew_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body

info "Installing brew..."

/bin/bash -c "NONINTERACTIVE=1 $(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"


eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"

if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding asdf to .bashrc..."

    pushUniqueLine "eval \"\$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)\"" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding asdf to .zshrc..."

    pushUniqueLine "eval \"\$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)\"" "$HOME/.zshrc"
fi


info "Installing brew packages from Brewfile..."

brew bundle --file="$brew_dir/Brewfile"
