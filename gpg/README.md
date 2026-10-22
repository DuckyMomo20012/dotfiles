# gpg

This directory includes `gpg` utility scripts, run with `bun`.

## Description

These scripts encrypt/decrypt the [`private`](../private/) directory and
export/import `gpg` keys. The email of the key can be given with `--email` or
the `GPG_EMAIL` environment variable.

## Usage

- File `dedot.ts`: Decrypt the encrypted archive.
  - Description:
    - Decrypt the file (encrypted by `gpg`), e.g., `encrypted.tar.gz.gpg`, in a
      private temp directory, extract it there, and copy the files to `dest`.
    - The plain tar file never lands in the repository; the temp directory is
      always removed.
    - A file that already exists in `dest` is left alone when identical. When it
      differs, the old one is backed up as `<file>.backup` (or
      `<file>.backup.<timestamp>`), unless you pass `--no-backup`.
    - Running it again changes nothing.
    - The passphrase is given to `gpg` on stdin, not on its command line. Without
      one (`-p` or `GPG_PASSPHRASE`) `gpg` asks for it.

  - Usage:

    ```
    Usage: bun dedot.ts [options]

    Options:
      -h, --help          Show this help message and exit
      -f, --file <filename>  Specify the filename to decrypt (default: <repo>/private/encrypted.tar.gz.gpg)
      -d, --dest <directory>  Specify the destination directory for decrypted files (default: <repo>/private)
      -p, --passphrase <passphrase>  Specify the passphrase for decryption (default: from environment variable GPG_PASSPHRASE)
      -n, --dry-run       Show what would change, change nothing
          --no-backup     Overwrite existing files directly instead of backing them up
          --force         Reinstall tools that are already installed
      -v, --verbose       Print every command that is run
    ```

- File `endot.ts`: Archive and encrypt directory.
  - Description:
    - Archive the `dest` directory to a tar file in a temp directory, then
      encrypt it with `gpg` for the key of `email`.
    - The archive excludes markdown files `(*.md)`, files with extension `.gpg`,
      `*.backup*` files, and files with "`!`" prepended, e.g., `!foo.txt`.
    - The encrypted file is written to the `private` directory. The plain tar file
      is deleted after the encryption process.
    - Encrypting is not deterministic: the `.gpg` file changes on every run, even
      when the content did not.

  - Usage:

    ```
    Usage: bun endot.ts [options]

    Options:
      -h, --help          Show this help message and exit
      -e, --email <email>  Specify the email address for GPG key (default: $GPG_EMAIL, then example@gmail.com)
      -f, --file <filename>  Specify the output encrypted filename (default: encrypted.tar.gz.gpg)
      -d, --dest <directory>  Specify the destination directory to encrypt files (default: <repo>/private)
      -n, --dry-run       Show what would change, change nothing
    ```

- File `export.ts`: Backup GPG keys.
  - Description:
    - Export `gpg` secret keys to the file. The file is only readable by you
      (`chmod 600`).

    > **Note**: This will export all necessary information to restore the
    > secrets keys including the trust database information.

    > **Warning**: This will export all secret keys, so you should keep this
    > file safe.

  - Usage:

    ```
    Usage: bun export.ts [options]

    Options:
      -h, --help          Show this help message and exit
      -e, --email <email> Specify the email address to export the GPG key (default: $GPG_EMAIL, then example@gmail.com)
      -f, --file <filename>  Specify the destination filename to export the GPG key (default: secret.asc)
      -n, --dry-run       Show what would change, change nothing
    ```

- File `import.ts`: Restore GPG keys.
  - Description:
    - Import and restore `gpg` keys from the file.
    - Skipped when a secret key for the email is already in the keyring (use
      `--force` to import anyway), so it is safe to run again.

    > **Note**: `gpg` prompt will be suppressed when importing keys.

  - Usage:

    ```
    Usage: bun import.ts [options]

    Options:
      -h, --help          Show this help message and exit
      -e, --email <email> Specify the email address to import the GPG key (default: $GPG_EMAIL, then example@gmail.com)
      -f, --file <filename>  Specify the filename to import the GPG key (default: secret.asc)
      -n, --dry-run       Show what would change, change nothing
          --no-backup     Overwrite existing files directly instead of backing them up
          --force         Reinstall tools that are already installed
      -v, --verbose       Print every command that is run
    ```
