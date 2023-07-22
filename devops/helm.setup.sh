#!/usr/bin/env bash

############################################
# Prepare environment

curr_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$curr_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body


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
