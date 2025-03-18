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

info "Installing Java..."

$HOME/.asdf/bin/asdf plugin add java https://github.com/halcyon/asdf-java.git

$HOME/.asdf/bin/asdf install java adoptopenjdk-17.0.14+7

$HOME/.asdf/bin/asdf set --home java adoptopenjdk-17.0.14+7

$HOME/.asdf/bin/asdf reshim java adoptopenjdk-17.0.14+7

if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding asdf to .bashrc..."

    pushUniqueLine ". \$HOME/.asdf/plugins/java/set-java-home.bash" "$HOME/.bashrc"

fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding asdf to .zshrc..."

    pushUniqueLine ". \$HOME/.asdf/plugins/java/set-java-home.zsh" "$HOME/.zshrc"

fi
