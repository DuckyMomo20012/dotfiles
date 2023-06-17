#!/usr/bin/env bash

docker_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$docker_dir"

# Load predefined functions
. ../utils/functions.sh

curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

# Setup bash completion
if [[ -f "$HOME/.bashrc" ]]; then
    info "Setup argocd autocompletion for .bashrc..."

    pushLineNonDup "if command -v argocd >/dev/null 2>&1; then source <(argocd completion bash); compdef _argocd argocd; fi" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Setup argocd autocompletion for .zshrc..."

    pushLineNonDup "if command -v argocd >/dev/null 2>&1; then source <(argocd completion zsh); compdef _argocd argocd; fi" "$HOME/.zshrc"
fi
