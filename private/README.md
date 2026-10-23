# private

This directory contains private files that are not meant to be shared with the
public. Only the **encrypted** archive `encrypted.tar.gz.gpg` is committed.

## Description

Every file or directory in this directory can be encrypted with `gpg` using the
[gpg/endot.ts](../gpg/endot.ts) script, and restored with
[gpg/dedot.ts](../gpg/dedot.ts) (or `bun bootstrap.ts --dedot`). Please refer to
[gpg/README.md](../gpg/README.md) to learn more about how to use these scripts,
and to [docs/private-files.md](../docs/private-files.md) for the complete
workflow (create a key, add files, encrypt, restore on a new machine, rotate a
token).

Default every file and directory in this directory will be ignored with
`.gitignore`. Except for `README.md`, `update-token.sh`, `*.gpg`, and files with
"`!`" prepended in the current directory or subdirectory.

## Layout

```text
private/
├── encrypted.tar.gz.gpg       committed: the encrypted archive
├── update-token.sh            committed: rotate a GitHub token
├── dotfiles-example/          committed: example, every file starts with "!"
└── dotfiles/                  git-ignored: your real private dotfiles
    ├── .git-credentials       -> linked to ~/.git-credentials
    ├── .gitconfig.local       -> linked to ~/.gitconfig.local
    └── setup.ts               optional: private setup, run with --dedot
```

`bun bootstrap.ts --dedot` decrypts the archive, symlinks `private/dotfiles/*` to
your home directory (same rules as [`dotfiles`](../dotfiles/README.md): existing
files are backed up to `<file>.backup`, or replaced directly with `--no-backup`;
correct links are left alone), then runs every `setup.ts` / `*.setup.ts` found
in this directory. Files starting with `!` are never linked or run.

If you want to keep file `setup.ts` in the top directory or subdirectory, you
can add these lines in file `.gitignore`:

```diff
 # .gitignore
 *
 !README.md
 !.gitignore
 !*.gpg
 # This will keep setup.ts in the top-level directory
+!setup.ts
 !\!*

 # This will keep all "!" files in the subdirectory
 !*/
 # This will keep setup.ts in subdirectories
+!*/setup.ts

```

## Examples

> **Note**: Remember to remove "`!`" prepended in the file name after copying to
> ignore these private files.

- [dotfiles-example](./dotfiles-example): Example of private dotfiles
  configuration.

```bash
mkdir -p private/dotfiles
cp 'private/dotfiles-example/!.git-credentials' private/dotfiles/.git-credentials
```

## Usage

- File `update-token.sh`: Update GitHub token.

  - Description:

    - Update the GitHub token in `dotfiles/private/dotfiles/.git-credentials`
      file.
    - Update the GitHub token in `dotfiles/private/dotfiles/.gitconfig.local`
      file.
    - Stops with a message when one of the files is missing. Running it again with
      the same token changes nothing.

  - Usage:

    ```
    ./update-token.sh [-t <token> | -b | -h]
    ```

    Options:

    - `-t <token>` (token): The GitHub token to update.
    - `-b` (backup): Backup existing files with new names, e.g., `filename.bak`
      before updating.
    - `-h` (help): Show help message.

  - Example:

    ```bash
    ./update-token.sh -t ghp_0123456789abcdefghijklmnopqrstuvwxyz -b
    cd .. && bun gpg/endot.ts          # encrypt the new values
    rm private/dotfiles/*.bak          # the backups still hold the old token
    ```
