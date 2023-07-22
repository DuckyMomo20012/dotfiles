#!/usr/bin/env bash

packages_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# We have cd to directory to make sure find only searches in this directory
cd "$packages_dir"

# Load predefined functions
. ../utils/functions.sh

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

############################################

find * -name "*.sh" -not -path "setup.sh" | while read setup; do
    # NOTE: We cd back to make sure the directory is correct
    cd "$packages_dir"

    info "Running $setup..."

    . ./$setup
done
