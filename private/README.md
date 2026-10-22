# private

This directory contains private files that are not meant to be shared with the
public.

## Description

Every file or directory in this directory can be encrypted with `gpg` using the
[gpg/endot.ts](../gpg/endot.ts) script, and restored with
[gpg/dedot.ts](../gpg/dedot.ts) (or `bun bootstrap.ts --dedot`). Please refer to
[gpg/README.md](../gpg/README.md) to learn more about how to use these scripts.

Put the files that go to your home directory in `private/dotfiles/`, with the
same layout as the public [dotfiles](../dotfiles/) directory. `bootstrap.ts
--dedot` symlinks them (backing up existing files, or replacing them with
`--no-backup`) and then runs the setup files found in this directory.

Default every file and directory in this directory will be ignored with
`.gitignore`. Except for `README.md`, `*.gpg`, and files with "`!`" prepended in
the current directory or subdirectory.

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
