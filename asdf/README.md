# asdf

Installs the [asdf](https://asdf-vm.com) version manager and the language tools
managed by it. It runs **first** in `bootstrap.ts`, because later setup files
(and your shell) may use these tools.

## What runs

| File                | What it does                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `setup.ts`          | Installs the asdf binary, adds asdf to `~/.bashrc` / `~/.zshrc` (PATH, shims, completion) |
| `go-utils.setup.ts` | protoc `29.3` and buf `1.49.0`                                                            |
| `go.setup.ts`       | golang `1.23.4`                                                                           |
| `java.setup.ts`     | java `adoptopenjdk-17.0.14+7`                                                             |
| `nodejs.setup.ts`   | nodejs `lts`                                                                              |

`setup.ts` runs first, the rest alphabetically.

## How it works

`setup.ts`:

1. Skips everything when `asdf` is on `PATH` or `~/.asdf/bin/asdf` exists
   (`--force` reinstalls).
2. Looks up the latest release of `asdf-vm/asdf` for your CPU (`amd64` or
   `arm64`) through the GitHub API, downloads it, and installs only the `asdf`
   binary into `~/.asdf/bin`.
3. Adds these lines to `~/.bashrc` and `~/.zshrc` (when the file exists, once):

   ```bash
   export PATH=$HOME/.asdf/bin:$PATH
   export PATH=${ASDF_DATA_DIR:-$HOME/.asdf}/shims:$PATH
   if command -v asdf >/dev/null 2>&1; then source <(asdf completion zsh); fi
   ```

The tool files call `asdfInstallTool`, which for each tool:

1. runs `asdf plugin add` only when the plugin is not in `asdf plugin list`,
2. runs `asdf install` only when `asdf where <plugin> <version>` fails,
3. pins the version globally with `asdf set -u` (writes `~/.tool-versions`),
4. runs `asdf reshim`.

## Run it

```bash
bun bootstrap.ts --only asdf                 # all of it
bun asdf/go.setup.ts                         # one tool
bun asdf/go.setup.ts --dry-run               # preview
```

A second run:

```text
$ bun asdf/go.setup.ts
Setting up asdf golang...
asdf plugin "golang" is already added.
golang 1.23.4 is already installed.
```

(`set -u` and `reshim` still run: they are cheap and keep the pin correct.)

## Customize

Add `asdf/<tool>.setup.ts`:

```ts
import { asdfInstallTool, logger } from '../lib/utils'

logger.info('Setting up asdf python...')

await asdfInstallTool({ plugin: 'python', version: '3.13.1' })
```

- `url` is only needed for plugins that asdf does not know by name (see
  `go.setup.ts`).
- `global: false` installs the version without pinning it.
- Change a version by editing the number in the file **and** in
  [`dotfiles/.tool-versions`](../dotfiles/.tool-versions): the file in `$HOME` is
  a symlink to that one, so the two must agree.

## Troubleshooting

- `GitHub API rate limit hit` while installing asdf: `export GITHUB_TOKEN=...`.
- `asdf: command not found` in your current terminal: open a new one, the
  `PATH` lines are only read by new shells.
- A plugin needs build tools (java, python): run `packages` first (it does by
  default) or install `build-essential`.
- `asdf install nodejs lts` resolves "lts" at the time it runs; a later run does
  not move you to a newer LTS because the install check uses the literal name.
  Pin a number (`22.11.0`) when you need reproducible builds.
