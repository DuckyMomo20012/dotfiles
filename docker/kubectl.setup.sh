#!/usr/bin/env bash

docker_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$docker_dir"

# Load predefined functions
. ../utils/functions.sh


curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Setup bash completion
if [[ -f "$HOME/.bashrc" ]]; then
    info "Setup kubectl autocompletion for .bashrc..."

    pushLineNonDup "if command -v kubectl >/dev/null 2>&1; then source <(kubectl completion bash); fi" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Setup kubectl autocompletion for .zshrc..."

    pushLineNonDup "if command -v kubectl >/dev/null 2>&1; then source <(kubectl completion zsh); fi" "$HOME/.zshrc"
fi

rm -rf kubectl
