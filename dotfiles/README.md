# dotfiles

This directory will symlink dotfiles to the home directory.

## Description

`setup.sh` will find all **files** or **directories** (including dotfiles) in
`dotfiles` directory and symlink them to the home directory.

File `setup.sh`, markdown files `(*.md)`, and files with "`!`" prepended will be
ignored, e.g., `!foo.txt`.

All files default to **backup** to `~/.dotfiles_backup` if they already exist.
You can go to [utils/README.md](../utils/README.md#file-functionssh) to read
instructions about the function `installDotFiles` and change its behavior.

> **Note**: New backup files will "overwrite" old backup files in
> `~/.dotfiles_backup` directory.

## Usage

Run `setup.sh` to symlink dotfiles:

```bash
./setup.sh
```
