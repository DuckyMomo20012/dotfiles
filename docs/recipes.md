# Recipes

Copy-paste solutions for common tasks. Every command can be run from the
repository directory (`cd ~/dotfiles`). Add `--dry-run` to any of them to
preview first.

- [Setting up machines](#setting-up-machines)
- [Day to day](#day-to-day)
- [Adding things](#adding-things)
- [Private files](#private-files)
- [Undoing things](#undoing-things)
- [CI and containers](#ci-and-containers)

## Setting up machines

### A brand new laptop

```bash
curl -fsSL https://raw.githubusercontent.com/DuckyMomo20012/dotfiles/main/install.sh | bash -s
```

### A new laptop with your private files and a `.deb` or two

Copy `examples/bootstrap.sh` next to your key and packages:

```text
~/Downloads/setup/
├── bootstrap.sh
├── secret.asc
└── code_1.95.0_amd64.deb
```

```bash
cd ~/Downloads/setup
export GPG_EMAIL=you@example.com
export GPG_PASSPHRASE='your passphrase'
./bootstrap.sh
```

`bootstrap.sh` installs the `.deb` files, runs `install.sh`, imports
`secret.asc` and decrypts `private/`. Pass any option to it, for example
`./bootstrap.sh --no-backup`.

### A machine that is already half configured

Preview, then run. Whatever exists is detected and skipped, existing dotfiles
are backed up.

```bash
bun bootstrap.ts --dry-run | less
bun bootstrap.ts
```

### Only the dotfiles, no installs

```bash
bun bootstrap.ts --only __none__ --skip asdf
```

### Only DevOps tools

```bash
bun bootstrap.ts --only devops --skip asdf
# or a single tool
bun devops/kubectl.setup.ts
```

### Everything except docker

```bash
bun bootstrap.ts --skip docker
```

### A server (no desktop)

Some files target desktop systems. Skip them:

```bash
bun bootstrap.ts --skip flathub --skip fuse --skip snap --skip lotus --skip misc
```

## Day to day

### I changed a file in `dotfiles/`

Nothing to do: `~/.zshrc` **is** `~/dotfiles/dotfiles/.zshrc`. Commit it:

```bash
git -C ~/dotfiles status
git -C ~/dotfiles commit -am "zsh: new alias"
```

### I added a new file to `dotfiles/`

Link it:

```bash
cp ~/.config/foo/config.toml ~/dotfiles/dotfiles/.config/foo/config.toml
bun bootstrap.ts --only __none__ --skip asdf
```

The first run replaces `~/.config/foo/config.toml` by a link; because the
content is identical, no backup is made.

### Pull the latest version of the repository and apply it

```bash
git -C ~/dotfiles pull --ff-only
bun bootstrap.ts
```

Or, from anywhere, re-run the installer (it fast-forwards the clone):

```bash
curl -fsSL https://raw.githubusercontent.com/DuckyMomo20012/dotfiles/main/install.sh | bash -s
```

### Reinstall one tool

```bash
bun bootstrap.ts --force --only devops/helm.setup
```

### Update all asdf tools to the versions in the scripts

Edit the version in `asdf/<tool>.setup.ts` (and in `dotfiles/.tool-versions`), then:

```bash
bun asdf/go.setup.ts
```

### See exactly what a script runs

```bash
bun devops/helm.setup.ts --dry-run --verbose
```

### Replace my local config with the repository version, no questions

```bash
bun bootstrap.ts --no-backup --only __none__ --skip asdf
```

Existing files are replaced directly (a regular file with the same content is
always replaced silently). Directories are never deleted without a backup.

## Adding things

### An apt package

Edit `packages/apt.setup.ts`:

```ts
const packages = [
  'git',
  // ...
  'ripgrep',
  // Disabled for now (starts with "!")
  '!pavucontrol',
].filter(pkg => !pkg.startsWith('!'))
```

```bash
bun packages/apt.setup.ts
```

### A snap package

Edit the list in `packages/snap.setup.ts`:

```ts
const packages = [
  'vlc',
  'spotify',
].filter(pkg => !pkg.startsWith('!'))
```

### A tool managed by asdf

Create `asdf/python.setup.ts`:

```ts
import { asdfInstallTool, logger } from '../lib/utils'

logger.info('Setting up asdf python...')

await asdfInstallTool({ plugin: 'python', version: '3.13.1' })
```

Add `python 3.13.1` to `dotfiles/.tool-versions`, then `bun asdf/python.setup.ts`.

### A command line tool distributed as a GitHub release

Create `devops/yq.setup.ts`:

```ts
import { join } from 'node:path'
import { appendToShellRc, download, ensureInstalled, exec, getArch, logger, withTempDir } from '../lib/utils'

logger.info('Setting up yq...')

await ensureInstalled('yq', async () => {
  await withTempDir(async (dir) => {
    const file = join(dir, 'yq')
    await download(`https://github.com/mikefarah/yq/releases/latest/download/yq_linux_${getArch()}`, file)
    await exec(['sudo', 'install', '-m', '0755', file, '/usr/local/bin/yq'])
  })
})

// yq spells it `shell-completion`, so write the line yourself.
// For tools that use `<tool> completion <shell>`, use `cobraCompletion('<tool>')`.
await appendToShellRc(shell => `if command -v yq >/dev/null 2>&1; then source <(yq shell-completion ${shell}); fi`)
```

Try it: `bun devops/yq.setup.ts --dry-run`, then without the flag, then again to see
`yq is already installed, skipping`.

### A tool from a tar.gz release (single binary inside)

```ts
import { join } from 'node:path'
import { download, ensureInstalled, getArch, getHome, githubLatestAsset, installBinaryFromTarGz, withTempDir } from '../lib/utils'

const dest = join(getHome(), '.local', 'bin', 'mytool')

await ensureInstalled('mytool', async () => {
  const asset = await githubLatestAsset('owner/mytool', name => name.endsWith(`linux_${getArch()}.tar.gz`))
  await withTempDir(async (dir) => {
    const archive = join(dir, 'mytool.tar.gz')
    await download(asset.url, archive)
    await installBinaryFromTarGz(archive, 'mytool', dest)
  })
}, { paths: [dest] })
```

### A third-party apt repository

```ts
import { aptInstall, aptUpdate, ensureAptRepo, getArch, getCodename } from '../lib/utils'

const changed = await ensureAptRepo({
  keyUrl: 'https://example.com/apt/key.gpg',
  keyPath: '/etc/apt/keyrings/example.gpg',
  dearmor: true,
  listPath: '/etc/apt/sources.list.d/example.list',
  listLine: `deb [arch=${getArch()} signed-by=/etc/apt/keyrings/example.gpg] https://example.com/apt ${await getCodename()} main`,
})

await aptUpdate({ maxAgeMinutes: changed ? 0 : 60 })
await aptInstall(['example'])
```

### A line in your shell config

```ts
import { appendToShellRc } from '../lib/utils'

await appendToShellRc(`export EDITOR=nvim`)

// One line per shell
await appendToShellRc(shell => `eval "$(zoxide init ${shell})"`)

// Login shell files instead of the rc files
await appendToShellRc('export XDG_CURRENT_DESKTOP=GNOME', { files: { bash: '.bash_profile', zsh: '.zprofile' } })
```

A shell is only configured when its rc file exists, and a line is only added
when it is not there yet.

### A line in a root-owned file

```ts
import { appendRootLine } from '../lib/utils'

await appendRootLine('/etc/sysctl.d/99-inotify.conf', 'fs.inotify.max_user_watches=524288')
```

### A clone of a git repository

```ts
import { join } from 'node:path'
import { getHome, gitCloneOrUpdate } from '../lib/utils'

await gitCloneOrUpdate('https://github.com/tmux-plugins/tpm', join(getHome(), '.tmux', 'plugins', 'tpm'))
```

Clones are fast-forwarded on later runs; a failed update only warns.

### A dotfile in a new place

Anywhere under `dotfiles/` is mirrored into `~`:

```bash
mkdir -p dotfiles/.config/starship && $EDITOR dotfiles/.config/starship/starship.toml
bun bootstrap.ts --only __none__ --skip asdf
```

## Private files

The complete workflow is in [`gpg/README.md`](../gpg/README.md). Short versions:

```bash
# Back up your key (keep the file safe!)
bun gpg/export.ts -e you@example.com -f ~/secret.asc

# Encrypt the private directory after changing it
bun gpg/endot.ts -e you@example.com

# Restore on a new machine
bun bootstrap.ts --dedot --secret ~/secret.asc --email you@example.com

# Rotate the GitHub token in the private files
./private/update-token.sh -t ghp_xxxxxxxx -b
bun gpg/endot.ts -e you@example.com
```

## Undoing things

### Restore the file I had before

```bash
ls -A ~ | grep backup          # .zshrc.backup  .gitconfig.backup.20261022044159
rm ~/.zshrc                    # a symlink into the repository: removing it deletes only the link
mv ~/.zshrc.backup ~/.zshrc
```

### Remove every link this project made

```bash
# Prints the links (and where they point). Remove them once the list looks right.
find ~ -xdev -type l -lname "$HOME/dotfiles/dotfiles/*" -print
find ~ -xdev -type l -lname "$HOME/dotfiles/dotfiles/*" -delete
```

Then restore your backups (`*.backup`) as above if you want your old files.

### Take a tool off

The scripts install tools in the normal ways, so remove them the normal ways:

| Tool                              | Remove                                                                    |
| --------------------------------- | ------------------------------------------------------------------------- |
| apt packages (docker, terraform)  | `sudo apt-get remove <pkg>`; delete `/etc/apt/sources.list.d/<name>.list` |
| `kubectl`, `argocd`, `kustomize`  | `sudo rm /usr/local/bin/<name>`                                           |
| `helmfile`, `uv`                  | `rm ~/.local/bin/<name>`                                                  |
| asdf tool                         | `asdf uninstall <plugin> <version>`                                       |
| oh-my-zsh                         | `rm -rf ~/.oh-my-zsh`                                                     |
| Lines in `~/.bashrc` / `~/.zshrc` | Delete them by hand; they are one line each and easy to find              |

## CI and containers

Run as root in a clean container to check a change end to end:

```bash
docker run --rm -it -v "$PWD":/dotfiles -w /dotfiles ubuntu:24.04 bash -c '
  apt-get update && apt-get install -y curl git unzip sudo ca-certificates &&
  curl -fsSL https://bun.com/install | bash &&
  export PATH=$HOME/.bun/bin:$PATH &&
  bun bootstrap.ts --skip docker --skip flathub --skip snap --skip lotus --skip misc &&
  bun bootstrap.ts --skip docker --skip flathub --skip snap --skip lotus --skip misc
'
```

The second run must print only "already installed" lines. The continuous
integration workflow in `.github/workflows/ci.yml` runs lint, type check, unit
tests, ShellCheck, a double dry run and a double symlink run on every push.
