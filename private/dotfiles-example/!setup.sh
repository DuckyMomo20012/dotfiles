#!/usr/bin/env bash

dotfiles_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$dotfiles_dir"

# NOTE: We have to cd first so we don't have to worry about relative path
# Load predefined functions
. ../../utils/functions.sh

installDotFiles "$dotfiles_dir"
