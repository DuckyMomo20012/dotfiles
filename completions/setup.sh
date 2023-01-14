#!/usr/bin/env bash

completion_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$completion_dir"

# Load predefined functions
. ../utils/functions.sh

pushLineNonDup "source $completion_dir/npm.sh" "$HOME/.bashrc"
