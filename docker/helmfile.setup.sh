#!/usr/bin/env bash

docker_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$docker_dir"

# Load predefined functions
. ../utils/functions.sh

OS="linux"
ARCH="amd64"

# Get latest helmfile release
download_url=$(curl -sSL https://api.github.com/repos/helmfile/helmfile/releases/latest | jq -r ".assets[] | .browser_download_url | select(. | test(\".*${OS}.*${ARCH}.*\"))")

info "Downloading helmfile from ${download_url}..."

# Download helmfile, extract only helmfile binary and place it in
# $HOME/.local/bin
curl -sSL ${download_url} | tar -C $HOME/.local/bin -xz helmfile


# Setup bash completion
if [[ -f "$HOME/.bashrc" ]]; then
    info "Setup helmfile autocompletion for .bashrc..."

    pushLineNonDup "if command -v helmfile >/dev/null 2>&1; then source <(helmfile completion bash); fi" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Setup helmfile autocompletion for .zshrc..."

    pushLineNonDup "if command -v helmfile >/dev/null 2>&1; then source <(helmfile completion zsh); fi" "$HOME/.zshrc"
fi
