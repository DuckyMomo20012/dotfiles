# packages

Base packages. This directory runs first in `bootstrap.ts`, because other setup
files need what it installs (`curl`, `git`, build tools...).

| File               | What it does                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `apt.setup.ts`     | Installs the apt packages of its `packages` list                            |
| `flathub.setup.ts` | Installs Flatpak and adds the Flathub remote                                |
| `fuse.setup.ts`    | Installs `libfuse2` (AppImage support)                                      |
| `npm.setup.ts`     | Sets the global npm prefix to `~/.npm-global` and adds its `bin` to `PATH`  |
| `snap.setup.ts`    | Installs the snap packages of its list (skipped when snap is missing)       |
| `uv.setup.ts`      | Installs [uv](https://docs.astral.sh/uv/) and its shell completion          |

Prefix a package name with `!` in a list to disable it without deleting it.
Only packages that are not installed yet are installed.
