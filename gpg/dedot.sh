#!/usr/bin/env bash

############################################
# Prepare environment

gpg_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$gpg_dir"

# Load predefined functions
. ../utils/crypto.sh
. ../utils/functions.sh

############################################
# Script body


# Default values
default_src="$(cd "$gpg_dir/../private" && pwd)/encrypted.tar.gz.gpg"
default_dst="$(cd "$gpg_dir/../private" && pwd)"

src="$default_src"
dst="$default_dst"

printUsage() {
    echo "Decrypted encrypted directory and run script files"
    echo ""
    echo "Usage: $(basename $0) [options]"
    echo "Options:"
    echo "  -f <file>    Source encrypted archive file. File name should end with .tar.gz.gpg"
    echo "  -d <path>    Destination directory"
    echo "  -p <pass>    Passphrase"
    echo "  -h           Show help message"
}

# Ref: https://www.baeldung.com/linux/bash-parse-command-line-arguments
# NOTE: I added a colon at the beginning of the optstring to suppress error
# message and handle manually with ":" and "?" cases
while getopts ':f:d:p:h' opt; do
  case "$opt" in
    f)
        src="${OPTARG}"
        ;;

    d)
        dst="${OPTARG}"
        ;;

    p)
        passphrase="${OPTARG}"
        ;;

    h)
        printUsage
        exit 0
        ;;

    :)
        echo -e "$0: option requires an argument.\n"
        printUsage
        exit 1
        ;;

    ?)
        echo -e "$0: illegal option.\n"
        printUsage
        exit 1
        ;;
  esac
done

# Decrypt encrypted archive into sub dotfiles directory
dedot "$src" "$dst" "$passphrase"

cd "$dst"
find * -name "setup.sh" | while read setup; do
    # NOTE: We cd back to make sure the directory is correct
    cd "$dst"

    . ./$setup
done
