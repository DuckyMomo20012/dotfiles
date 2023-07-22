#!/usr/bin/env bash

info() {
    tput bold;tput setaf "6";tput setab "7";echo "$1";tput sgr0;tput el;
}

info "Installing azure-cli..."

curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
