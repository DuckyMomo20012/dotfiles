# dotfiles

Files in this directory are symlinked into your home directory by
`bootstrap.ts`, keeping the layout: `dotfiles/.config/foo/bar` becomes
`~/.config/foo/bar`.

## Rules

- Files starting with `!`, markdown files, files with `setup` in the name and
  `*.backup` files are not linked.
- A file that already exists in your home directory is moved to
  `<file>.backup` first (`--no-backup` replaces it directly). A link that is
  already correct is left alone, so running again never creates more backups.
- Edit the files here, not in your home directory: they are the same file.

## Note about shell config

Setup scripts add lines (PATH, completions) to `~/.zshrc`. When `~/.zshrc` is the
symlink to [`.zshrc`](./.zshrc), such a line lands in this repository, but only
when it is missing, so it is a one time change you can commit.
