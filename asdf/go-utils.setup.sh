#!/usr/bin/env bash

info() {
    tput bold;tput setaf "6";tput setab "7";echo "$1";tput sgr0;tput el;
}

info "Installing protoc..."

$HOME/.asdf/bin/asdf plugin add protoc https://github.com/paxosglobal/asdf-protoc.git

$HOME/.asdf/bin/asdf install protoc 29.3

$HOME/.asdf/bin/asdf set --home protoc 29.3

info "Installing buf..."

$HOME/.asdf/bin/asdf plugin add buf https://github.com/truepay/asdf-buf

$HOME/.asdf/bin/asdf install buf 1.49.0

$HOME/.asdf/bin/asdf set --home buf 1.49.0
