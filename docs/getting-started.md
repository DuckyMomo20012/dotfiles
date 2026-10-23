# Getting started

This guide takes you from an empty machine to a fully configured one, step by
step, and shows what you should see at every step. If you only want the short
version, see the [README](../README.md#toolbox-getting-started).

- [What you need](#what-you-need)
- [Step 1: Get the repository](#step-1-get-the-repository)
- [Step 2: Preview with a dry run](#step-2-preview-with-a-dry-run)
- [Step 3: Run it for real](#step-3-run-it-for-real)
- [Step 4: Run it again (nothing should change)](#step-4-run-it-again-nothing-should-change)
- [Step 5: Open a new shell](#step-5-open-a-new-shell)
- [Step 6 (optional): Private files](#step-6-optional-private-files)
- [What changed on my machine?](#what-changed-on-my-machine)
- [Where to go next](#where-to-go-next)

## What you need

| Requirement            | Why                                                                 | How to check                  |
| ---------------------- | ------------------------------------------------------------------- | ----------------------------- |
| Debian or Ubuntu       | Most setup files use `apt`. Tested on Ubuntu 22.04 and newer LTS.   | `cat /etc/os-release`         |
| A user with `sudo`     | Installing packages and writing to `/etc` and `/usr/local/bin`.     | `sudo -v`                     |
| Internet access        | Downloads packages, release binaries and git repositories.          | `curl -sI https://github.com` |
| `curl`, `git`, `unzip` | Fetch the repository and `bun`. `install.sh` installs them for you. | `command -v curl git unzip`   |

`root` works too (containers, CI): `sudo` is skipped automatically when you are
root.

You do **not** need to install `bun` yourself. `install.sh` does it. If you
prefer to do it by hand, see [bun.sh](https://bun.sh).

## Step 1: Get the repository

There are two ways. Both end in the same place: the repository in
`~/dotfiles` and `bun` installed.

### Option A: the one-liner

```bash
curl -fsSL https://raw.githubusercontent.com/DuckyMomo20012/dotfiles/main/install.sh | bash -s -- --dry-run
```

Everything after `--` is handed to `bun bootstrap.ts`. Here it is `--dry-run`,
so nothing is installed apart from the tools needed to fetch the repository
(`curl`, `git`, `unzip`, `bun`). Those four are the only things `install.sh`
changes before it hands over, and it skips every one that is already there.

### Option B: clone it yourself

```bash
git clone https://github.com/DuckyMomo20012/dotfiles.git ~/dotfiles
cd ~/dotfiles
curl -fsSL https://bun.com/install | bash     # skip if bun is installed
export PATH="$HOME/.bun/bin:$PATH"
```

To use a fork, another branch or another location with the one-liner, set
environment variables:

```bash
export DOTFILES_REPO=https://github.com/you/dotfiles.git
export DOTFILES_BRANCH=my-branch
export DOTFILES_DIR=$HOME/src/dotfiles
curl -fsSL https://raw.githubusercontent.com/DuckyMomo20012/dotfiles/main/install.sh | bash -s
```

## Step 2: Preview with a dry run

A dry run walks through every step and prints what it **would** do. It changes
nothing in your home directory or system.

```bash
cd ~/dotfiles
bun bootstrap.ts --dry-run
```

Lines starting with `[dry-run]` are changes that were skipped. This is a real
excerpt, limited to `helm` with `bun bootstrap.ts --dry-run --only devops/helm --skip asdf`:

```text
Dry run: nothing will be changed.
Skipping asdf (--skip asdf).
Running setup files...
Searching for setup files in directory: "~/dotfiles"
Running setup files in directory: "~/dotfiles/devops"
Running setup file: ~/dotfiles/devops/helm.setup.ts
Setting up helm...
[dry-run] $ bash -o pipefail -c 'curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash'
Installing helm plugins...
[dry-run] $ /usr/local/bin/helm plugin install https://github.com/databus23/helm-diff
Setup helm autocompletion
[dry-run] append to ~/.bashrc: if command -v helm >/dev/null 2>&1; then source <(helm completion bash); fi
Updated ~/.bashrc
...
```

How to read it:

- `Running setup file: ...` is one `*.setup.ts` file starting. Each runs in its
  own process.
- `[dry-run] $ ...` is a command that was not run.
- `[dry-run] append to <file>: <line>` is a line that would be added to a file
  because it is not there yet. A line that already exists is not printed.
- Tools that are already installed print `<tool> is already installed, skipping
(use --force to reinstall).` instead of an install command.

Run it a second time and compare: a dry run never changes anything, so the
output is the same.

> **Tip**: add `--verbose` to also see the commands that are only inspected
> (for example `dpkg-query` and `asdf plugin list`).

## Step 3: Run it for real

```bash
bun bootstrap.ts
```

What happens, in order:

1. **sudo**: you are asked for your password once. It is kept alive for the
   whole run (and dropped at the end), so you are not asked again.
2. **asdf** (`asdf/`): installs the version manager, then Go, Java, Node.js,
   protoc and buf.
3. **Everything else**: `packages` first (they provide `curl`, `git`, build
   tools), then `install_deb` and `brew`, then all other directories in
   alphabetical order (`devops`, `lotus`, `misc`, `zsh`).
4. **Dotfiles**: everything in `dotfiles/` is symlinked into `~`.
5. **Summary**: `All done.`

If a setup file fails, the run **stops** and tells you which one:

```text
Setup file "~/dotfiles/devops/docker.setup.ts" failed with exit code: 1
Error: Setup file(s) failed: ~/dotfiles/devops/docker.setup.ts (exit 1)
```

Fix the cause (read the lines above the error) and simply run the same command
again: finished work is skipped, so it continues roughly where it stopped. To
get the full picture in one go instead, run with `--keep-going`:

```bash
bun bootstrap.ts --keep-going
...
Finished with 2 failed setup file(s):
  - ~/dotfiles/devops/docker.setup.ts (exit 1)
  - ~/dotfiles/lotus/setup.ts (exit 100)
```

### If you already have dotfiles

Your existing files are never lost. Say you already have a `~/.zshrc`:

```text
Backed up existing ~/.zshrc to ~/.zshrc.backup
Linked ~/dotfiles/dotfiles/.zshrc to ~/.zshrc
Symlinks: 270 linked, 0 already up to date, 1 backed up
```

`~/.zshrc.backup` is your old file, byte for byte. If `~/.zshrc.backup` already
exists, the new backup is called `~/.zshrc.backup.<YYYYMMDDHHMMSS>` so the older
one is kept. To skip backups entirely, add `--no-backup`:

```bash
bun bootstrap.ts --no-backup
```

### Installing only some things

`--only` and `--skip` take part of a path (relative to the repository) and can
be repeated. Both examples below run only inside `devops`:

```bash
bun bootstrap.ts --only devops --skip docker --skip azure
bun bootstrap.ts --only devops/kubectl --only devops/helm.setup
```

`--only __none__` matches nothing, which is a handy way to run only the
dotfile symlinks:

```bash
bun bootstrap.ts --only __none__ --skip asdf
```

## Step 4: Run it again (nothing should change)

This is the most useful check that everything works. Run the same command:

```bash
bun bootstrap.ts
```

Real output of the symlink step on the second run:

```text
Symlinking dotfiles from "~/dotfiles/dotfiles" to home directory...
Symlinks: 0 linked, 270 already up to date, 0 backed up
All done.
```

Installed tools print `... is already installed, skipping`, packages print
`Already installed: ...`, and no line is appended to a file twice. If a second
run changes something, that is a bug: please open an issue.

## Step 5: Open a new shell

Setup files add PATH entries and completions to `~/.bashrc` and `~/.zshrc`, and
the login shell may have changed to zsh. Log out and back in (needed for the
`docker` group and the login shell), or at least open a new terminal:

```bash
exec zsh
asdf current          # nodejs, golang, java, protoc, buf
kubectl version --client
```

The first start of zsh with powerlevel10k may run its configuration wizard; the
saved configuration is already in `dotfiles/.p10k.zsh`, so it normally does not.

## Step 6 (optional): Private files

Credentials such as `~/.git-credentials` live encrypted in
`private/encrypted.tar.gz.gpg`. To decrypt them on a new machine you need your
GPG secret key (for example `secret.asc`, exported with `gpg/export.ts`).

```bash
export GPG_PASSPHRASE='your passphrase'     # optional, gpg asks if missing
bun bootstrap.ts --dedot --secret ~/secret.asc --email you@example.com
```

This imports the key (skipped if it is already in your keyring), decrypts the
archive into `private/`, symlinks `private/dotfiles/*` into `~`, and runs the
setup files found in `private/`. The full workflow, including how to create and
update the archive, is in [`gpg/README.md`](../gpg/README.md) and
[`private/README.md`](../private/README.md).

## What changed on my machine?

| Where                                                     | What                                                 |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `~/dotfiles`                                              | The repository                                       |
| `~/.bun`                                                  | bun                                                  |
| `~/.asdf`                                                 | asdf and the tools it installed                      |
| `~/.oh-my-zsh`                                            | oh-my-zsh, powerlevel10k and plugins                 |
| `~/.local/bin`                                            | `helmfile`, `uv`                                     |
| `/usr/local/bin`                                          | `kubectl`, `argocd`, `kustomize`, `helm`, `k3d`      |
| `/etc/apt/sources.list.d`                                 | `docker.list`, `hashicorp.list`, `fcitx5-lotus.list` |
| `/etc/apt/keyrings`, `/usr/share/keyrings`                | Signing keys of those repositories                   |
| `~/.bashrc`, `~/.zshrc`, `~/.bash_profile`, `~/.zprofile` | Lines for PATH, completions, input method            |
| `~/*` symlinks                                            | Everything in `dotfiles/`                            |
| `~/*.backup`                                              | Your previous files that were replaced by links      |
| `/etc/modprobe.d/alsa-base.conf`                          | Audio power saving off (`misc`)                      |

To undo it, see [Undoing things](./recipes.md#undoing-things).

## Where to go next

- [Recipes](./recipes.md): common tasks with exact commands.
- [How it works](./how-it-works.md): run order, idempotency rules, design.
- [Troubleshooting](./troubleshooting.md): error messages and fixes.
- [`lib/README.md`](../lib/README.md): the helper library for your own setup
  files.
