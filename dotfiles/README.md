# dotfiles

Files in this directory are symlinked into your home directory by
`bootstrap.ts` (last step of the run, after all setup files). The layout is kept:
`dotfiles/.config/foo/bar` becomes `~/.config/foo/bar`.

## What is here

| File             | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `.zshrc`         | zsh + oh-my-zsh + powerlevel10k, PATH, completions          |
| `.p10k.zsh`      | powerlevel10k prompt configuration                          |
| `.gitconfig`     | Git configuration (private values go in `.gitconfig.local`) |
| `.npmrc`         | npm prefix (`~/.npm-global`)                                |
| `.tool-versions` | asdf versions, keep in sync with `asdf/*.setup.ts`          |
| `.wezterm.lua`   | WezTerm configuration                                       |
| `.huskyrc`       | Loads nvm/asdf before git hooks (husky)                     |
| `.fonts/`        | JetBrains Mono and Monaspace fonts                          |

## Rules

A file is linked unless its name

- starts with `!` (a disabled file or an example),
- ends with `.md`,
- contains `setup` (setup scripts live in other directories, but never rely on
  this for dotfiles: do not call a dotfile `*setup*`),
- is a `.backup` file made by this project.

What happens when the target already exists:

| In `$HOME`                          | Result                                  |
| ----------------------------------- | --------------------------------------- |
| Nothing                             | Link created                            |
| The link, already correct           | Nothing (a second run changes nothing)  |
| A different file                    | Renamed to `<file>.backup`, then linked |
| A different file with `--no-backup` | Replaced directly                       |

Full table and options: [`lib/README.md`](../lib/README.md#symlinks-and-backups-in-detail).

## Add a dotfile

```bash
# 1. put it here, with its path relative to $HOME
mkdir -p dotfiles/.config/nvim
cp ~/.config/nvim/init.lua dotfiles/.config/nvim/init.lua

# 2. preview, then link (the original is backed up or relinked, see above)
bun bootstrap.ts --only __none__ --dry-run
bun bootstrap.ts --only __none__

ls -la ~/.config/nvim/init.lua
# /home/you/.config/nvim/init.lua -> /home/you/dotfiles/dotfiles/.config/nvim/init.lua
```

`--only __none__` selects no setup file, so only the symlink step runs.

## Edit a dotfile

Edit `~/.zshrc` or `dotfiles/.zshrc`: they are the same file. Commit from the
repository.

## Secrets do not belong here

This directory is public. Put tokens and personal values in
[`private/dotfiles/`](../private/README.md) (encrypted), and reference them from
a local file such as `.gitconfig.local`.

## Note about shell config

Setup scripts add lines (PATH, completions) to `~/.zshrc`. Because `~/.zshrc` is a
link to [`.zshrc`](./.zshrc), such a line lands in this repository, but only when
it is missing, so it is a one-time change you can review and commit. Better: add
the line to `.zshrc` yourself and commit it; the script then finds it and does
nothing.

## Troubleshooting

- A file in `$HOME` is not a link any more (a tool rewrote it): run
  `bun bootstrap.ts --only __none__`. Identical content is relinked silently,
  different content is backed up first.
- Dangling links after you removed a file here: see
  [troubleshooting](../docs/troubleshooting.md#symlinks-and-backups).
- Fonts do not show up: run `fc-cache -f` (or log out and in).
