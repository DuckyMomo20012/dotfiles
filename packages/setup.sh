#!/usr/bin/env bash

############################################
# Prepare environment

packages_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$packages_dir"

# Load predefined functions
. ../utils/functions.sh

############################################
# Script body

find * -name "*.sh" -not -path "setup.sh" | while read setup; do
    # NOTE: We cd back to make sure the directory is correct
    cd "$packages_dir"

    info "Running $setup..."

    . ./$setup
done

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

