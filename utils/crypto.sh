#!/usr/bin/env bash

endot() {
    email="$1"

    src="$2"

    # Destination dir is tar file name
    dstTarFile="${3:-"encrypted.tar.gz"}"

    if [[ "$dstTarFile" == *.tar.gz ]]; then

        echo "Creating tar archive..."

        # Archive file will exclude setup.sh, markdown files and files with "!"
        # prepended
        tar --exclude="$dstTarFile" \
            --exclude="*.md" --exclude="!*" --exclude="*.gpg" \
            -cvf "$dstTarFile" -C "$src" "."

        echo "Finished creating tar archive"

        echo "Encrypting tar archive..."

        # Encrypt tar file
        gpg -er "$email" "$dstTarFile"

        echo "Finished encrypting tar archive"

        rm -rf "$dstTarFile"
    else
        echo "\"$3\" is not a valid tar file name. Please use a name ending with \".tar.gz\"."
    fi

}

dedot() {
    src="$1"

    dst="$2"

    passphrase="$3"

    tarFile="${src%%.gpg}"

    echo "Decrypting tar archive..."

    if [[ "$passphrase" == ""  ]]; then
        gpg -do "$tarFile" "$src"
    else
        gpg --pinentry-mode=loopback --passphrase "$passphrase" -do "$tarFile" "$src"

    fi

    # Check destination directory exists
    if [[ ! -d "$dst" ]]; then
        mkdir -p "$dst"
    fi

    echo "Extracting tar archive..."

    tar -xvf "$tarFile" -C "$dst"

    echo "Finished extracting tar archive"

    rm -rf "$tarFile"
}

exportSecretKey() {
    email="$1"
    backupFileName="${2:-"secret.asc"}"

    # NOTE: "This will export all necessary information to restore the secrets
    # keys including the trust database information."
    gpg --output "$backupFileName" \
        --armor \
        --export-secret-keys \
        --export-options export-backup \
        "$email"
}

exportPublicKey() {
    email="$1"
    backupFileName="${2:-"public.asc"}"

    # NOTE: This will export public key only
    gpg --output "$backupFileName" --armor --export "$email"
}

importKey() {
    backupFileName="${1:-"secret.asc"}"

    # Use "batch" option to suppress interactive prompt
    gpg --batch --import-options restore --import "$backupFileName"
}
