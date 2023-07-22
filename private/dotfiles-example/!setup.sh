#!/usr/bin/env bash

############################################
# Prepare environment

dotfiles_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$dotfiles_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body


installDotFiles "$dotfiles_dir"
