# packages

Base packages. This directory runs **first** in `bootstrap.ts` (together with
`install_deb` and `brew`), because other setup files need what it installs:
`curl`, `git`, build tools, `gnupg`.

## Files

| File               | What it does                                                                         |
| ------------------ | ------------------------------------------------------------------------------------ |
| `apt.setup.ts`     | Installs the apt packages of its `packages` list                                     |
| `flathub.setup.ts` | Installs Flatpak and the GNOME software plugin, adds the Flathub remote              |
| `fuse.setup.ts`    | Installs `libfuse2` (needed by AppImages), enabling the `universe` repository        |
| `npm.setup.ts`     | Sets the global npm prefix to `~/.npm-global` and adds its `bin` directory to `PATH` |
| `snap.setup.ts`    | Installs the snap packages of its list (skipped when `snap` is not installed)        |
| `uv.setup.ts`      | Installs [uv](https://docs.astral.sh/uv/) and adds its shell completion              |

Order: alphabetical (`apt`, `flathub`, `fuse`, `npm`, `snap`, `uv`).

## How repeated runs behave

- `aptInstall` checks each package with `dpkg-query` and installs **only the
  missing ones**. `apt-get update` is skipped when the package lists are less than
  an hour old.
- `fuse` is skipped when `libfuse2` (or `libfuse2t64` on Ubuntu 24.04) is installed.
- `npm` creates `~/.npm-global` and writes `prefix=<home>/.npm-global` to
  `~/.npmrc` once. Later `bootstrap.ts` replaces `~/.npmrc` with the link to
  [`dotfiles/.npmrc`](../dotfiles/.npmrc) (`prefix=${HOME}/.npm-global`) and keeps
  the old file as `~/.npmrc.backup`.
- `snap` checks `snap list <pkg>` per package.
- `uv` is skipped when `uv` is on `PATH` or `~/.local/bin/uv` exists.

```text
$ bun packages/apt.setup.ts
Installing APT packages...
Already installed: git, curl, make, build-essential, npm, gnupg, python3-venv, gnome-shell-extension-manager
```

## Customize

Edit the list at the top of the file. A name that starts with `!` is disabled
(kept as a note, never installed):

```ts
const packages = [
  'git',
  'ripgrep',
  // My Internet driver
  '!r8168-dkms',
].filter(pkg => !pkg.startsWith('!'))
```

Add a new file for a new package manager or repository, for example
`packages/pipx.setup.ts`; see [`lib/README.md`](../lib/README.md).

## Troubleshooting

- `Could not get lock /var/lib/dpkg/lock-frontend`: another apt is running; the
  script waits up to 5 minutes. Wait and run again.
- `snap is not available on this system`: expected on systems without snapd; the
  step is skipped.
- `E: Unable to locate package ...`: the name is wrong for your release, or
  `universe` is disabled. `sudo apt-get update && apt-cache policy <pkg>`.
