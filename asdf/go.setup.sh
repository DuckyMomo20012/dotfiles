#!/usr/bin/env bash

info() {
    tput bold;tput setaf "6";tput setab "7";echo "$1";tput sgr0;tput el;
}

info "Installing Golang..."

asdf plugin add golang https://github.com/asdf-community/asdf-golang.git

asdf install golang 1.21.4

asdf global golang 1.21.4
