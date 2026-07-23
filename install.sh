#!/usr/bin/env bash

sudo apt-get update
sudo apt-get install -y curl git

git clone https://github.com/DuckyMomo20012/dotfiles.git "$HOME/dotfiles"

cd "$HOME/dotfiles"

# NOTE: Install bun for running scripts
curl -fsSL https://bun.com/install | bash

source ~/.bashrc

# NOTE: Run bun bootstrap file
$HOME/.bun/bin/bun bootstrap.ts
