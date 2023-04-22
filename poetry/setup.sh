#!/usr/bin/env bash

info() {
    tput bold;tput setaf "6";tput setab "7";echo "$1";tput sgr0;tput el;
}

info "Installing Poetry..."

curl -sSL https://install.python-poetry.org | python3 -
