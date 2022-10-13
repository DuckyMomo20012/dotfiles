# private

This directory contains private files that are not meant to be shared with the
public.

## Getting Started

Every file or directory in this directory can be encrypted with `gpg` using
[dotfiles/gpg/endot.sh](../gpg/endot.sh) script. Please refer to
[dotfiles/gpg/README.md](../gpg/README.md) to learn more about how to use this
script.

Default every file and directory in this directory will be ignored with
`.gitignore`. Except for `README.md`, `*.gpg`, and files with "`!`" prepended in
the current directory or subdirectory.

If you want to keep file `setup.sh` in the top directory or subdirectory, you
can add these lines in file `.gitignore`:

```diff
 # .gitignore
 *
 !README.md
 !.gitignore
 !*.gpg
 # This will keep setup.sh in the top-level directory
+!setup.sh
 !\!*

 # This will keep all "!" files in the subdirectory
 !*/
 # This will keep setup.sh in subdirectories
+!*/setup.sh

```

## Examples

> **Note**: Remember to remove "`!`" prepended in the file name after copying to
> ignore these private files.

- [dotfiles-example](./dotfiles-example): Example of private dotfiles
  configuration.

## Usage

- File `update-token.sh`: Update GitHub token.

  - Description:

    - Update the GitHub token in `dotfiles/private/dotfiles/.git-credentials`
      file.
    - Update the GitHub token in `dotfiles/private/dotfiles/.gitconfig.local`
      file.

  - Usage:

    ```
    ./update-token.sh [-t <token> | -b | -h]
    ```

    Options:

    - `-t <token>` (token): The GitHub token to update.
    - `-b` (backup): Backup existing files with new names, e.g., `filename.bak`
      before updating.
    - `-h` (help): Show help message.
