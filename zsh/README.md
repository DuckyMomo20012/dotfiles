# zsh

Installs zsh, makes it your login shell, and sets up
[oh-my-zsh](https://ohmyz.sh) with the powerlevel10k theme and three plugins.

## What runs

`setup.ts`, in order, each step skipped when done:

1. `aptInstall(['zsh', 'git'])` (git is also needed at run time by zsh-autocomplete).
2. `sudo chsh -s <zsh> <you>`: only when your login shell in `/etc/passwd` is not
   already zsh.
3. oh-my-zsh: installed with its unattended installer only when `~/.oh-my-zsh`
   does not exist. An existing `~/.zshrc` is kept (`KEEP_ZSHRC=yes`), so the
   installer never replaces your link to `dotfiles/.zshrc` with its template.
4. Theme and plugins in `~/.oh-my-zsh/custom` (shallow `git clone`, fast-forwarded
   on later runs):
   - `themes/powerlevel10k`
   - `plugins/zsh-autosuggestions`
   - `plugins/zsh-autocomplete`
   - `plugins/zsh-syntax-highlighting`
5. `~/.cache/zsh/zasync`: the async helper of zsh-autocomplete. Recent versions no
   longer bundle it and would clone it on the first prompt; doing it here avoids that.

All of them follow the default branch of their repository, which is what their install
instructions recommend. Last checked against upstream on 2026-11-02: oh-my-zsh
(master, 2026-10-27), zsh-syntax-highlighting (master, 2026-10-09; tag 0.8.0),
zsh-autocomplete (main, 2026-09-13; tag 26.08.04), powerlevel10k (master, 2026-09-06;
tag v1.20.0), zsh-autosuggestions (master, 2025-06-24; tag v0.7.1).

The configuration is in [`dotfiles/.zshrc`](../dotfiles/.zshrc),
[`dotfiles/.zshenv`](../dotfiles/.zshenv) and
[`dotfiles/.p10k.zsh`](../dotfiles/.p10k.zsh); `bootstrap.ts` links them in its last
step.

Two rules from the plugins' own documentation that `.zshrc` / `.zshenv` follow:

- zsh-autocomplete takes over `compinit`: it is sourced before `oh-my-zsh.sh`, and on
  Ubuntu `~/.zshenv` sets `skip_global_compinit=1` so `/etc/zsh/zshrc` does not run
  its own `compinit` first.
- zsh-syntax-highlighting must be the last entry of `plugins=(...)`.

## Run it

```bash
bun zsh/setup.ts --dry-run
bun bootstrap.ts --only zsh
```

First run (shortened):

```text
Installing zsh...
Installing: zsh
Changing default shell to zsh...
Installing oh-my-zsh...
Installing powerlevel10k theme...
Installing zsh-autosuggestions plugin...
```

Second run:

```text
Already installed: zsh
Changing default shell to zsh...
The login shell of you is already zsh.
Installing oh-my-zsh...
oh-my-zsh is already installed.
Installing powerlevel10k theme...
Updating /home/you/.oh-my-zsh/custom/themes/powerlevel10k...
```

## Customize

- Add a plugin: add a `[name, url]` pair to the `plugins` list in `setup.ts`, then
  add the name to `plugins=(...)` in `dotfiles/.zshrc`.
- Another theme: change `ZSH_THEME` in `dotfiles/.zshrc` and remove the
  powerlevel10k block here.

## About the `backup/` directory

`backup/.zshrc.pre-oh-my-zsh` and `backup/.shell.pre-oh-my-zsh` are copies of what
the oh-my-zsh installer saved when it first ran on the author's machine. No script
reads them; keep them as a record or delete them.

## Troubleshooting

- The shell did not change: `chsh` applies at the next login (`getent passwd $USER`
  shows it immediately).
- `git clone` fails behind a proxy: set `https_proxy`; an already cloned
  plugin only warns (`Could not update ...`) and keeps working.
- Completion looks broken after an upgrade: `rm -f ~/.zcompdump* ~/.cache/zsh/compdump`,
  then open a new shell. zsh-autocomplete logs to `~/.local/state/zsh-autocomplete/log`.
- Slow first prompt: run `p10k configure` once, or keep `.p10k.zsh` from this
  repository.
