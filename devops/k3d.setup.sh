#!/usr/bin/env bash

############################################
# Prepare environment

devops_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$devops_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body


info "Installing k3d..."

curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash


# Setup bash completion
if [[ -f "$HOME/.bashrc" ]]; then
    info "Setup k3d autocompletion for .bashrc..."

    pushUniqueLine "if command -v k3d >/dev/null 2>&1; then source <(k3d completion bash); fi" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Setup k3d autocompletion for .zshrc..."

    pushUniqueLine "if command -v k3d >/dev/null 2>&1; then source <(k3d completion zsh); fi" "$HOME/.zshrc"
fi
