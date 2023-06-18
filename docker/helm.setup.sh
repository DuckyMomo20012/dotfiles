#!/usr/bin/env bash

docker_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$docker_dir"

# Load predefined functions
. ../utils/functions.sh

info "Installing helm..."

curl -s https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install helm plugins
helm plugin install https://github.com/databus23/helm-diff

# Setup bash completion
if [[ -f "$HOME/.bashrc" ]]; then
    info "Setup helm autocompletion for .bashrc..."

    pushLineNonDup "if command -v helm >/dev/null 2>&1; then source <(helm completion bash); fi" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Setup helm autocompletion for .zshrc..."

    pushLineNonDup "if command -v helm >/dev/null 2>&1; then source <(helm completion zsh); fi" "$HOME/.zshrc"
fi
