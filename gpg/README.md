# gpg

This directory includes `gpg` utility scripts.

## Description

These scripts can be used to encrypt a directory, e.g., `private` or
export/import gpg keys.

## Usage

All of these scripts are just wrappers around functions in
[utils/crypto.sh](../utils/crypto.sh).

- File `dedot.sh`: Decrypted encrypted directory and run script files.

  - Description:

    - Decrypt file from `src` (encrypted by `gpg`), e.g., `encryped.tar.gz.gpg`,
      to `encrypted.tar.gz`, then extract it to `dst`.

    - After extracting, it will remove the tar file, e.g, `encrypted.tar.gz`.
    - Finally, it will **find all `setup.sh` files and run it**.

    > **Warning**: This script will overwrite existing files and directories in
    > `dst` directory. So **backup is necessary** before running this script.

  - Usage:

    ```
    ./dedot.sh [-f <file> | -d <path> | -p <pass> | -h]
    ```

    Options:

    - `-f <file>` (src): The source archive file (encrypted by `gpg`) to
      decrypt. The file name should have the extension `.tar.gz.gpg` at the end.
      Default:`dotfiles/private/encrypted.tar.gz.gpg`.
    - `-d <path>` (dst): The destination directory to extract files to, create
      if not exist. Default: `dotfiles/private`.
    - `-p <pass>` (pass): The passphrase to decrypt the archive file. If not
      provided, it will be prompted.
    - `-h` (help): Show help message.

- File `endot.sh`: Archive and encrypt directory.

  - Description:

    - Archive the `src` directory to a tar file (`dstTarFile.gpg`), then encrypt
      it with `gpg` using `email`, which is `gpg` user id.
    - Archive file will exclude `setup.sh`, markdown files `(*.md)`, files with
      extension `.gpg`, and files with "`!`" prepended, e.g., `!foo.txt`.
    - The encrypted tar file will be created in `src` directory.
    - The tar file will be deleted after the encryption process.

  - Usage:

    ```
    ./endot.sh [-e <email> | -d <path> | -f <file> | -h]
    ```

    Options:

    - `-e <email>` (email): The recipient of a public-key encrypted document.
      The parameter name is either the name of the individual or the e-mail
      address of the individual to whom you are sending the message. Default:
      `tienvinh.duong4@gmail.com`.
    - `-d <path>` (src): The directory will be archived and encrypted. Default:
      `dotfiles/private`.
    - `-f <file>` (dstTarFile): The file name of the tar file that will be
      encrypted. The file name **MUST have the extension `.tar.gz` at the end**.
      The encrypted file will be created with the name `dstTarFile.gpg` **in the
      directory extracted from `dstTarFile`**. Default:
      `dotfiles/private/encrypted.tar.gz`.
    - `-h` (help): Show help message.

- File `export.sh`: Backup GPG keys.

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
    ./export.sh [-e <email> | -f <file> | -h]
    ```

    Options:

    - `-e <email>` (email): The recipient of a public-key encrypted document.
      The parameter name is either the name of the individual or the e-mail
      address of the individual to whom you are sending the message. Default:
      `tienvinh.duong4@gmail.com`.
    - `-f <file>` (backupFileName): The file name of exported gpg keys. Default:
      `secret.asc`.
    - `-h` (help): Show help message.

- File `import.sh`: Restore GPG keys.

  - Description:

    - Import and restore `gpg` keys from the file.

    > **Note**: `gpg` prompt will be suppressed when importing keys.

  - Usage:

    ```
    ./import.sh [-f <file> | -h]
    ```

    Options:

    - `-f <file>` (backupFileName): The file name of exported gpg keys **to
      import**. Default: `secret.asc`.
    - `-h` (help): Show help message.
