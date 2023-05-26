#!/usr/bin/env bash

info() {
    tput bold;tput setaf "6";tput setab "7";echo "$1";tput sgr0;tput el;
}

info "Installing protoc..."

asdf plugin-add protoc https://github.com/paxosglobal/asdf-protoc.git

asdf install protoc 3.20.3

asdf global protoc 3.20.3

info "Installing buf..."

asdf plugin-add buf https://github.com/truepay/asdf-buf

asdf install buf 1.19.0

asdf global buf 1.19.0
