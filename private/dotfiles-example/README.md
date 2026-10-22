# dotfiles (private)

This directory will symlink dotfiles to the home directory.

## Description

This directory will process the same way as the [dotfiles](../../dotfiles)
directory: files keep their layout, existing files are backed up to
`<file>.backup` (or replaced directly with `--no-backup`), and links that are
already correct are left alone.

## Usage

Remove the "`!`" prepended in the file names, then run `setup.ts` to symlink
dotfiles (`bun bootstrap.ts --dedot` does it for you):

```bash
bun setup.ts [--dry-run] [--no-backup]
```
