#!/usr/bin/env bash

info() {
    tput bold;tput setaf "6";tput setab "7";echo "$1";tput sgr0;tput el;
}

info "Installing NodeJS..."

$HOME/.asdf/bin/asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git

$HOME/.asdf/bin/asdf install nodejs 22.16.0

$HOME/.asdf/bin/asdf set --home nodejs 22.16.0

$HOME/.asdf/bin/asdf reshim nodejs 22.16.0

$HOME/.asdf/bin/asdf env node npm install -g npm@latest pnpm@latest yarn@latest typescript@latest
