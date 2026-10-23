# brew

Installs [Homebrew](https://brew.sh) for Linux and the packages listed in
[`Brewfile`](./Brewfile).

## What runs

`setup.ts`:

1. Installs Homebrew unless `brew` is on `PATH` or
   `/home/linuxbrew/.linuxbrew/bin/brew` exists (`--force` reinstalls). The
   installer runs with `NONINTERACTIVE=1`. It must **not** run as root: Homebrew
   refuses; use a normal user with sudo.
2. Adds `export PATH=/home/linuxbrew/.linuxbrew/bin:$PATH` to `~/.bashrc` and
   `~/.zshrc` once.
3. Runs `brew bundle --file=brew/Brewfile` when the Brewfile has entries (lines
   that are not empty or comments). `brew bundle` skips what is installed.

It needs `curl`, `git` and build tools: `bootstrap.ts` runs `packages` before
`brew`.

## Run it

```bash
bun bootstrap.ts --only brew
bun brew/setup.ts --dry-run
```

## Customize

`brew/Brewfile` is a normal [Brewfile](https://docs.brew.sh/Brew-Bundle-and-Brewfile).
It is empty now. Example:

```ruby
# CLI tools
brew "jq"
brew "ripgrep"

# Taps and formulae from them
tap "homebrew/bundle"
```

`Brewfile.lock.json` is written by `brew bundle`; commit it to record versions.

Install, then list what is not in the Brewfile:

```bash
bun brew/setup.ts
brew bundle cleanup --file=brew/Brewfile      # shows extras, add --force to remove them
```

## Troubleshooting

- `Don't run this as root!`: run as a normal user.
- `brew: command not found` after the first run: open a new terminal (the PATH
  line is read by new shells), or `eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"`.
