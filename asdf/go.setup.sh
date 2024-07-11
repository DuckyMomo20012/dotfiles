#!/usr/bin/env bash

############################################
# Prepare environment

asdf_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$asdf_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body

info() {
    tput bold;tput setaf "6";tput setab "7";echo "$1";tput sgr0;tput el;
}

info "Installing Golang..."

asdf plugin add golang https://github.com/asdf-community/asdf-golang.git

asdf install golang 1.22.3

asdf global golang 1.22.3

if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding asdf to .bashrc..."

    pushUniqueLine ". \$HOME/.asdf/plugins/golang/set-env.zsh" "$HOME/.bashrc"

    pushUniqueLine "export PATH=\"\$(asdf where golang)/bin\":\$PATH" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding asdf to .zshrc..."

    pushUniqueLine ". \$HOME/.asdf/plugins/golang/set-env.zsh" "$HOME/.zshrc"

    pushUniqueLine "export PATH=\$(asdf where golang)/bin:\$PATH" "$HOME/.zshrc"
fi
