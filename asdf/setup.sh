#!/usr/bin/env bash

############################################
# Prepare environment

asdf_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$asdf_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body

sudo apt-get install jq -y

info "Installing asdf..."

output_tar="./asdf.tar.gz"
dest_bin="$HOME/.asdf/bin"

wget -q -O "$output_tar" $(wget -q -O - 'https://api.github.com/repos/asdf-vm/asdf/releases/latest' | jq -r '.assets[] | select(.name | test(".*linux-amd64.tar.gz$")).browser_download_url')

mkdir -p "$dest_bin"

tar -xzvf "$output_tar" -C "$dest_bin"

rm "$output_tar"

if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding asdf to .bashrc..."

    pushUniqueLine "export PATH=${ASDF_DATA_DIR:-\$HOME/.asdf}/shims:\$PATH" "$HOME/.bashrc"
    pushUniqueLine "export PATH=\$HOME/.asdf/bin:\$PATH" "$HOME/.bashrc"

    info "Setup asdf autocompletion for .bashrc..."

    pushUniqueLine "if command -v asdf >/dev/null 2>&1; then source <(asdf completion bash); fi" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding asdf to .zshrc..."

    pushUniqueLine "export PATH=${ASDF_DATA_DIR:-\$HOME/.asdf}/shims:\$PATH" "$HOME/.zshrc"
    pushUniqueLine "export PATH=\$HOME/.asdf/bin:\$PATH" "$HOME/.zshrc"

    info "Setup asdf autocompletion for .zshrc..."

    pushUniqueLine "if command -v asdf >/dev/null 2>&1; then source <(asdf completion zsh); fi" "$HOME/.zshrc"
fi

find * -name "*.sh" -not -path "setup.sh" | while read setup; do
    # NOTE: We cd back to make sure the directory is correct
    cd "$asdf_dir"

    info "Running $setup..."

    . ./$setup
done
