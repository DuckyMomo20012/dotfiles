# gpg

This directory includes `gpg` utility scripts.

## Description

These scripts can be used to encrypt a directory, e.g., `private` or
export/import gpg keys.

## Usage

- File `dedot.ts`: Decrypted encrypted directory and run script files.
  - Description:
    - Decrypt file from `src` (encrypted by `gpg`), e.g., `encryped.tar.gz.gpg`,
      to `encrypted.tar.gz`, then extract it to `dst`.
    - After extracting, it will remove the tar file, e.g, `encrypted.tar.gz`.
    - Finally, it will **find all `setup.sh` files and run it**.

    > **Warning**: This script will overwrite existing files and directories in
    > `dst` directory. So **backup is necessary** before running this script.

  - Usage:

    ```
    Usage: bun dedot.ts [options]

    Options:
      -h, --help          Show this help message and exit
      -f, --file <filename>  Specify the filename to decrypt (default: /home/vinh/dotfiles/private/encrypted.tar.gz.gpg)
      -d, --dest <directory>  Specify the destination directory for decrypted files (default: /home/vinh/dotfiles/private)
      -p, --passphrase <passphrase>  Specify the passphrase for decryption (default: from environment variable GPG_PASSPHRASE)
    ```

- File `endot.ts`: Archive and encrypt directory.
  - Description:
    - Archive the `src` directory to a tar file (`dstTarFile.gpg`), then encrypt
      it with `gpg` using `email`, which is `gpg` user id.
    - Archive file will exclude `setup.sh`, markdown files `(*.md)`, files with
      extension `.gpg`, and files with "`!`" prepended, e.g., `!foo.txt`.
    - The encrypted tar file will be created in `src` directory.
    - The tar file will be deleted after the encryption process.

  - Usage:

    ```
    Usage: bun endot.ts [options]

    Options:
      -h, --help          Show this help message and exit
      -e, --email <email>  Specify the email address for GPG key (default: example@gmail.com)
      -f, --file <filename>  Specify the output encrypted filename (default: /home/vinh/dotfiles/private/encrypted.tar.gz.gpg)
      -d, --dest <directory>  Specify the destination directory to encrypt files (default: /home/vinh/dotfiles/private)
    ```

- File `export.ts`: Backup GPG keys.
  - Description:
    - Export `gpg` secret keys to the file.

    > **Note**: This will export all necessary information to restore the
    > secrets keys including the trust database information. If you want to
    > export public key only, you can use the function `exportPublicKey` in
    > [utils/crypto.sh](../utils/crypto.sh).

    > **Warning**: This will export all secret keys, so you should keep this
    > file safe.

  - Usage:

    ```
    Usage: bun export.ts [options]

    Options:
      -h, --help          Show this help message and exit
      -e, --email <email> Specify the email address to export the GPG key (default: example@gmail.com)
      -f, --file <filename>  Specify the destination filename to export the GPG key (default: secret.asc)
    ```

- File `import.sh`: Restore GPG keys.
  - Description:
    - Import and restore `gpg` keys from the file.

    > **Note**: `gpg` prompt will be suppressed when importing keys.

  - Usage:

    ```
    Usage: bun import.ts [options]

    Options:
      -h, --help          Show this help message and exit
      -e, --email <email> Specify the email address to import the GPG key (default: example@gmail.com)
      -f, --file <filename>  Specify the filename to import the GPG key (default: secret.asc)
    ```
