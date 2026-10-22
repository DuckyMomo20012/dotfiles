# asdf

Installs the [asdf](https://asdf-vm.com) version manager and the tools managed
by it.

## Files

- `setup.ts`: downloads the latest asdf release for your CPU (`amd64`/`arm64`),
  installs it to `~/.asdf/bin`, and adds asdf to `~/.bashrc` / `~/.zshrc` (PATH,
  shims, completion). Skipped when asdf is already installed; `--force`
  reinstalls it. Set `GITHUB_TOKEN` if you hit the GitHub API rate limit.
- `go.setup.ts`, `go-utils.setup.ts` (protoc, buf), `java.setup.ts`,
  `nodejs.setup.ts`: install one tool each with `asdfInstallTool`.

## Customize

Add `<tool>.setup.ts`:

```ts
import { asdfInstallTool } from '../lib/utils'

await asdfInstallTool({ plugin: 'python', version: '3.13.1' })
```

`asdfInstallTool` adds the plugin, installs the version and pins it globally
(`asdf set -u`), skipping every step that is already done. Pass `url` for
plugins that asdf does not know by name, and `global: false` to skip the pin.

> **Note**: Keep the versions in sync with [`dotfiles/.tool-versions`](../dotfiles/.tool-versions).
