#!/usr/bin/env bash

docker_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$docker_dir"

# Load predefined functions
. ../utils/functions.sh

info "Installing k3d..."

curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash


# Setup bash completion
if [[ -f "$HOME/.bashrc" ]]; then
    info "Setup k3d autocompletion for .bashrc..."

    pushLineNonDup "if command -v k3d >/dev/null 2>&1; then source <(k3d completion bash); fi" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Setup k3d autocompletion for .zshrc..."

    pushLineNonDup "if command -v k3d >/dev/null 2>&1; then source <(k3d completion zsh); fi" "$HOME/.zshrc"
fi
