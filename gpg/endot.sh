#!/usr/bin/env bash

############################################
# Prepare environment

gpg_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$gpg_dir"

# Load predefined functions
. ../utils/crypto.sh

############################################
# Script body


# Default values
default_email="tienvinh.duong4@gmail.com"
# Src directory should be absolute path
default_src="$(cd "$gpg_dir/../private" && pwd)"
# Destination dir is tar file name
default_dstTarFile="encrypted.tar.gz"


email="$default_email"
src="$default_src"
dstTarFile="$default_dstTarFile"

printUsage() {
    echo "Archive and encrypt directory"
    echo ""
    echo "Usage: $(basename $0) [options]"
    echo "Options:"
    echo "  -e <email>    Email address"
    echo "  -d <path>     Source directory will be archived and encrypted"
    echo "  -f <file>     Destination tar file name that will be encrypted"
    echo "  -h            Show help message"
}

while getopts ':e:d:f:h' opt; do
  case "$opt" in
    e)
        email="${OPTARG}"
        ;;

    d)
        src="${OPTARG}"
        ;;

    f)

        dstTarFile="${OPTARG}"
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

# Encrypt private directory
endot "$email" "$src" "$src/$dstTarFile"
