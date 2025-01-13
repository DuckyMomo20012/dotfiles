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

asdf plugin add java https://github.com/halcyon/asdf-java.git

asdf install java adoptopenjdk-jre-21.0.5+11.0.LTS

asdf global java adoptopenjdk-jre-21.0.5+11.0.LTS

if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding asdf to .bashrc..."

    pushUniqueLine ". \$HOME/.asdf/plugins/java/set-java-home.bash" "$HOME/.bashrc"

fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding asdf to .zshrc..."

    pushUniqueLine ". \$HOME/.asdf/plugins/java/set-java-home.zsh" "$HOME/.zshrc"

fi
