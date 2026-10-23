# gpg

This directory includes `gpg` utility scripts, run with `bun`.

## Description

These scripts encrypt/decrypt the [`private`](../private/) directory and
export/import `gpg` keys. The email of the key can be given with `--email` or
the `GPG_EMAIL` environment variable.

All scripts are run with bun from the repository root. Run any of them with
`--help` to see its options.

## The whole workflow in five commands

The details of each step are in [`docs/private-files.md`](../docs/private-files.md).

```bash
export GPG_EMAIL=you@example.com

# 1. once: back up your secret key (file mode 600). Keep it offline.
bun gpg/export.ts --file ~/secret.asc

# 2. every time you change private/dotfiles: encrypt, then commit the .gpg file
bun gpg/endot.ts
git add private/encrypted.tar.gz.gpg && git commit -m "private: update"

# 3. on a new machine: import the key (skipped if present) ...
bun gpg/import.ts --file ~/secret.asc

# 4. ... and decrypt (asks for the passphrase, or reads GPG_PASSPHRASE)
bun gpg/dedot.ts

# 5. link the files and run private setup files (or do 3-5 with one command)
bun bootstrap.ts --dedot --secret ~/secret.asc
```

Every script supports `--dry-run` where it changes something, and is safe to run
again.

## Which file to use

| I want to...                               | Script                     |
| ------------------------------------------ | -------------------------- |
| Save my secret key to a file               | `export.ts`                |
| Put my key on a new machine                | `import.ts`                |
| Encrypt `private/` after editing it        | `endot.ts`                 |
| Decrypt `private/encrypted.tar.gz.gpg`     | `dedot.ts`                 |
| Do import + decrypt + link + private setup | `bun bootstrap.ts --dedot` |

## Example session

```text
$ bun gpg/endot.ts --email you@example.com
Encrypting /tmp/endot-k3Jd9s/encrypted.tar.gz to /home/you/dotfiles/private/encrypted.tar.gz.gpg for you@example.com...
Encrypted /tmp/endot-k3Jd9s/encrypted.tar.gz to /home/you/dotfiles/private/encrypted.tar.gz.gpg for you@example.com
Deleting temporary tar file /tmp/endot-k3Jd9s/encrypted.tar.gz...

$ bun gpg/dedot.ts
Decrypting /home/you/dotfiles/private/encrypted.tar.gz.gpg to /home/you/dotfiles/private...
Decrypting ... to /tmp/dotfiles-private-Qw12/archive.tar.gz...
Extracting ... to /home/you/dotfiles/private...
Private files: 3 written, 0 already up to date, 0 backed up

$ bun gpg/dedot.ts                       # again
Private files: 0 written, 3 already up to date, 0 backed up

$ echo edited > private/dotfiles/.git-credentials; bun gpg/dedot.ts
Backed up existing /home/you/dotfiles/private/dotfiles/.git-credentials to ....git-credentials.backup
Private files: 1 written, 2 already up to date, 1 backed up
```

Back-up files made by `dedot.ts` contain your old (possibly secret) content. They
are git-ignored, left out of the archive and never linked into `$HOME`: delete them
when you do not need them.

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

  - Examples:

    ```bash
    bun gpg/dedot.ts                                   # default file and destination
    bun gpg/dedot.ts --dry-run                         # decrypt nothing, show the plan
    bun gpg/dedot.ts -f ~/backup/private.tar.gz.gpg -d /tmp/check   # inspect somewhere else
    GPG_PASSPHRASE=... bun gpg/dedot.ts --no-backup    # unattended, overwrite changed files
    ```

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

  - Examples:

    ```bash
    bun gpg/endot.ts -e you@example.com                # the usual case
    bun gpg/endot.ts -d ~/other-private -f other.tar.gz.gpg
    bun gpg/endot.ts --dry-run                         # build the tarball, do not encrypt
    ```

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
