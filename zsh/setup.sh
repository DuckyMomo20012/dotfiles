#!/usr/bin/env bash

info() {
    tput bold;tput setaf "6";tput setab "7";echo "$1";tput sgr0;tput el;
}

info "Installing zsh..."

sudo apt-get install zsh -y

command -v zsh | sudo tee -a /etc/shells

info "Changing your shell to zsh..."

sudo chsh -s $(which zsh) $USER

info "Installing oh-my-zsh..."

# NOTE: This variable is also used to locate the oh-my-zsh directory.
export ZSH="$HOME/.oh-my-zsh"

rm -rf "$ZSH"

# NOTE: We only clone the repo, the `.zshrc` file is only defined in the
# `dotfiles` directory
git clone https://github.com/ohmyzsh/ohmyzsh.git "$ZSH"

info "Installing powerlevel10k theme..."

git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
