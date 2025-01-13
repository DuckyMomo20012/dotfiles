#!/usr/bin/env bash

info() {
    tput bold;tput setaf "6";tput setab "7";echo "$1";tput sgr0;tput el;
}

info "Installing NodeJS..."

asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git

asdf install nodejs 22.13.0

asdf global nodejs 22.13.0
