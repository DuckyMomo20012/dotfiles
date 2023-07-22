#!/usr/bin/env bash

############################################
# Prepare environment

curr_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$curr_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body


info "Installing kustomize..."

curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"  | bash

sudo mv kustomize /usr/local/bin

# Setup bash completion
if [[ -f "$HOME/.bashrc" ]]; then
    info "Setup kustomize autocompletion for .bashrc..."

    pushLineNonDup "if command -v kustomize >/dev/null 2>&1; then source <(kustomize completion bash); compdef _kustomize kustomize; fi" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Setup kustomize autocompletion for .zshrc..."

    pushLineNonDup "if command -v kustomize >/dev/null 2>&1; then source <(kustomize completion zsh); compdef _kustomize kustomize; fi" "$HOME/.zshrc"
fi
