#!/usr/bin/env bash

packages_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$packages_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Prep for npm install global
mkdir -p "$HOME/.npm-global"

# NOTE: We don't use command to set config because npm is not installed yet
pushLineNonDup "prefix=\${HOME}/.npm-global" "$HOME/.npmrc"

if [[ -f "$HOME/.bashrc" ]]; then
    info "Adding .npm-global to .bashrc..."

    pushLineNonDup "export PATH=\$HOME/.npm-global/bin:\$PATH" "$HOME/.bashrc"
fi

if [[ -f "$HOME/.zshrc" ]]; then
    info "Adding .npm-global to .zshrc..."

    pushLineNonDup "export PATH=\$HOME/.npm-global/bin:\$PATH" "$HOME/.zshrc"
fi


export PATH=~/.npm-global/bin:$PATH

############################################


COMMENT=\#*

find * -name "*.txt" -type f | while read fileName; do
    # %% is "parameter expansion" operator, extract fileName before FIRST dot
    # Ref: https://tldp.org/LDP/abs/html/parameter-substitution.html#PSUB2
    cmd="${fileName%%.*}"

    # NOTE: We prepend $1_ to file name so it will install first
    # Strip FIRST characters between $ and _
    cmd="${cmd#\$*_}"

    # Set $1 to $cmd
    set -- "$cmd"

    info "Installing \"$1\" packages..."
    while read package; do
        if [[ $package == $COMMENT || $package == "" ]]; then continue; fi
        info "Installing $package..."

        # Install $package with $cmd
        $cmd $package
    done < "$fileName"

    success "Finished installing \"$1\" packages."
done
