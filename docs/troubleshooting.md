# Troubleshooting

Find your symptom, read the cause, apply the fix. Almost every fix ends with
"run the same command again": the scripts skip what is done, so retrying is
safe.

First, two habits that solve most problems:

```bash
bun bootstrap.ts --dry-run --verbose --only <name>   # what would it do, and why
bun <dir>/<file>.setup.ts --verbose                  # run one file alone, with all commands shown
```

- [Installer and bun](#installer-and-bun)
- [sudo and permissions](#sudo-and-permissions)
- [Network and downloads](#network-and-downloads)
- [apt](#apt)
- [Symlinks and backups](#symlinks-and-backups)
- [Shell config](#shell-config)
- [Tools](#tools)
- [GPG and private files](#gpg-and-private-files)
- [Development: lint, types, tests](#development-lint-types-tests)

## Installer and bun

### `bun: command not found`

`bun` lives in `~/.bun/bin`, which is only on `PATH` in a new shell.

```bash
export PATH="$HOME/.bun/bin:$PATH"
bun --version
```

### `install.sh` says `<dir> exists and is not a git repository`

`~/dotfiles` exists but has no `.git` directory (for example you unpacked a zip
there). Either move it away, or point the installer elsewhere:

```bash
mv ~/dotfiles ~/dotfiles.old
# or
DOTFILES_DIR=$HOME/src/dotfiles bash install.sh
```

### `Could not fast-forward ~/dotfiles (local changes?)`

You have commits or edits in the clone, so `git pull --ff-only` refused. The
installer keeps going with what is there. Update by hand when you are ready:

```bash
git -C ~/dotfiles stash && git -C ~/dotfiles pull --ff-only && git -C ~/dotfiles stash pop
```

### Prompts do not work when I use `curl | bash`

`install.sh` reconnects the script to the terminal (`/dev/tty`) before running
`bootstrap.ts`. If there is no terminal (SSH without `-t`, cron, CI), pass
everything by flag or variable and avoid prompts:

```bash
export GPG_EMAIL=you@example.com GPG_PASSPHRASE='...' GPG_SECRET_FILE=./secret.asc
curl -fsSL .../install.sh | bash -s -- --dedot
```

## sudo and permissions

### `Failed to start a sudo session. Check your sudo configuration.`

`sudo -v` failed: wrong password three times, or your user is not in the `sudo`
group.

```bash
groups                       # should list sudo
su -c 'usermod -aG sudo $USER'   # as root, then log out and in
```

### `Cannot run "sudo": ...`

You are not root and `sudo` is not installed. Install it as root
(`apt-get install sudo`) or run the whole thing as root.

### The password is asked many times

The keep-alive is skipped for root, with `--dry-run`, and when `sudo -n true`
already works. If you run a setup file alone (`bun devops/helm.setup.ts`),
there is no keep-alive: run `sudo -v` first.

### `Operation not permitted` / `Permission denied` writing to `/usr/local/bin`

A script used a command without `sudo`, or the target is on a read-only file
system. Re-run the single file with `--verbose` to see the failing command.

## Network and downloads

### `GitHub API rate limit hit for owner/repo. Set GITHUB_TOKEN and retry.`

Unauthenticated GitHub API calls are limited to 60 per hour per address (shared
offices and VPNs hit it fast).

```bash
export GITHUB_TOKEN=$(gh auth token)      # or a token with no scopes
bun bootstrap.ts --only helmfile
```

### `HTTP 404 Not Found for https://...`

The upstream release changed its file names. The message names the URL. Fix the
matching line in the setup file (for `asdf` and `helmfile` it is the
`name.includes(...)`/`endsWith(...)` filter).

### Downloads fail behind a proxy

`fetch` and `curl` both honor `HTTPS_PROXY`; for a custom certificate authority
set `SSL_CERT_FILE` (curl) and `NODE_EXTRA_CA_CERTS` (bun):

```bash
export HTTPS_PROXY=http://proxy:3128 SSL_CERT_FILE=/etc/ssl/corp.pem NODE_EXTRA_CA_CERTS=/etc/ssl/corp.pem
```

### `Checksum mismatch for <file>: expected ..., got ...`

The file is corrupt or was replaced. Nothing was installed. Retry; if it
repeats, check the upstream release page before you install anything.

### Offline

Everything that is already installed is skipped without network access. `git`
updates of the zsh theme and plugins only warn (`Could not update ...`).
Terraform keeps its existing apt list when the repository cannot be checked.

## apt

### `Could not get lock /var/lib/dpkg/lock-frontend`

Another apt process runs (often unattended upgrades right after boot). The
scripts already wait up to 5 minutes (`DPkg::Lock::Timeout=300`). If it still
fails, wait and re-run.

### `E: Unable to locate package <name>`

The package is not in your release or the repository was not added. For a third
party package, run its setup file alone (`bun devops/terraform.setup.ts`) so the
repository is added first. For a package that is only for another release
(`libfuse2` vs `libfuse2t64`), adjust the list in the file.

### A dialog appears in the middle of the run

apt runs with `DEBIAN_FRONTEND=noninteractive` by default. A dialog means
`DOTFILES_APT_INTERACTIVE=1` is set, or a tool outside this project asked.

### `W: ... is configured multiple times`

A repository exists twice (for example `docker.list` and an older
`docker.sources`). Delete the old file in `/etc/apt/sources.list.d/`.

## Symlinks and backups

### `Refusing to overwrite directory <path> without a backup. Move or delete it first.`

You used `--no-backup` and a directory is where a file link should go. The
project never deletes a directory silently. Move it yourself, or run without
`--no-backup` to have it renamed to `<path>.backup`.

### I have lots of `.backup` files

Each is a file you had before the first run. After you checked them, delete
them:

```bash
find ~ -maxdepth 3 -name '*.backup' -o -maxdepth 3 -name '*.backup.*'
```

(The tool never creates a second backup of a link that is already correct.)

### `Cannot link missing source file: ...`

A file disappeared between listing and linking, or a broken symlink is inside
`dotfiles/`. Check `git status`.

### A link points to the wrong place

```bash
readlink -f ~/.zshrc          # where does it go?
bun bootstrap.ts --only __none__ --skip asdf
```

A link to somewhere else is moved to `.backup` (it is kept) and recreated.

### I edited `~/.zshrc` and now `git status` shows a change

Correct: `~/.zshrc` is the repository file. Commit or discard it.

### My editor replaced the link with a regular file

Some editors save by writing a new file. Run the symlink step again; the file
is compared with the repository version and either replaced silently (same
content) or backed up (different):

```bash
bun bootstrap.ts --only __none__ --skip asdf
```

Copy the changes from the `.backup` file into the repository file afterwards.

## Shell config

### A line was added twice

Only an **exactly equal** line is detected as already present (trailing spaces
are ignored). If you edited a generated line (`export PATH=$HOME/.asdf/bin:$PATH`
became `export PATH="$HOME/.asdf/bin:$PATH"`), the original is added again on
the next run. Keep the generated form, or add your variant to the script.

### A new tool's completion does nothing

Open a new shell: rc files are read at start. `exec zsh` is enough.

### Lines were added to `dotfiles/.zshrc` in the repository

When `~/.zshrc` is the symlink to the repository, a setup file that adds a
missing line changes the repository file. It happens once per line. Review and
commit it:

```bash
git -C ~/dotfiles diff dotfiles/.zshrc
```

### `compdef: command not found` in bash

The `argocd` line also calls `compdef`, a zsh function. Bash ignores the failure
after `source`. If it bothers you, make the `argocd` line zsh only in
`devops/argocd.setup.ts` (`appendToShellRc(..., { shells: ['zsh'] })`).

## Tools

### asdf: `plugin ... already added` or `... already installed`

Not an error: the scripts now check both. If you still see it, you ran an old
copy of the script.

### asdf: `No such plugin` or `version ... is not installed`

```bash
asdf plugin list
asdf list <plugin>
bun asdf/<tool>.setup.ts --verbose
```

### Node.js: signature or `gpg` errors from the asdf nodejs plugin

```bash
NODEJS_CHECK_SIGNATURES=no bun asdf/nodejs.setup.ts
```

### Docker: `permission denied while trying to connect to the Docker daemon`

The group change needs a new login session:

```bash
newgrp docker     # this terminal only
# or log out and back in
```

### Docker on Linux Mint, Pop!_OS or another derivative

The repository line uses the Ubuntu codename from `/etc/os-release`
(`UBUNTU_CODENAME`), not `lsb_release`. If Docker has no repository for a very
new codename, `apt-get update` shows a 404 for `download.docker.com`; edit
`/etc/apt/sources.list.d/docker.list` to use the previous LTS codename.

### zsh: the prompt looks broken (squares instead of icons)

Select a Nerd Font in your terminal. Fonts are linked into `~/.fonts`
(JetBrains Mono and Monaspace); refresh the cache and restart:

```bash
fc-cache -f
```

### zsh: `zsh-autocomplete` conflicts or slows the shell

Remove `zsh-autocomplete` from the `plugins=(...)` array in `dotfiles/.zshrc`.
The clone in `~/.oh-my-zsh/custom/plugins` can stay.

### Homebrew: `Don't run this as root!`

Homebrew refuses to install as root. Run `bun brew/setup.ts` as a normal user,
or skip it: `--skip brew`.

### `helmfile`/`uv` is installed but not found

They go to `~/.local/bin`, which must be on `PATH`. Most distributions add it
at login if the directory exists; log out and in, or:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

## GPG and private files

### `gpg: decryption failed: No secret key`

The key that encrypted the archive is not in your keyring.

```bash
gpg --list-secret-keys
bun gpg/import.ts -f ~/secret.asc -e you@example.com --force
```

### `gpg: public key decryption failed: Bad passphrase`

The passphrase is wrong. In scripts, avoid shell history expansion by quoting:
`export GPG_PASSPHRASE='p@ss!word'`.

### `gpg: public key decryption failed: Inappropriate ioctl for device`

`gpg` needs a terminal to ask for the passphrase and there is none. Give it
non-interactively with `GPG_PASSPHRASE` (the scripts pass it on stdin with
loopback pinentry).

### `GPG secret file "<file>" does not exist.`

`--secret`/`GPG_SECRET_FILE` points to a missing file. Use an absolute path.

### `Email is required to import the GPG key.`

Not a terminal and no `--email`/`GPG_EMAIL`. Pass one of them.

### Private files were not linked

`--dedot` links `private/dotfiles/*`. If your archive keeps them elsewhere you
see `No ".../private/dotfiles" directory in the private archive, nothing to
symlink.` Either move them into `private/dotfiles/` and run
`bun gpg/endot.ts`, or link them from your own `private/.../setup.ts` with
`symlinkDotfileDir`.

### `The specified file "..." does not have a .gpg extension` or `The encrypted file "..." does not exist.`

`gpg/dedot.ts --file` must be an existing path that ends with `.gpg`. Relative
paths are relative to the current directory, not to the repository.

### `Failed to decrypt ... (gpg exit code 2)`

`gpg` itself failed; the lines above the error say why (missing key, wrong
passphrase, corrupt file). Run the same command with `--verbose` to see the
exact `gpg` call.

## Development: lint, types, tests

### ESLint: `You have used a rule which requires type information`

Fixed in `eslint.config.mjs`: type-aware rules apply to TypeScript files only.
If you add a rule that needs type information, put it in a block with a
`files: ['**/*.ts']` filter, like the existing one:

```js
{
  files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
  },
},
```

### `bun test` touches my real home directory

It must not. Tests use temporary directories and set `HOME` to one. If you
write a test that calls a setup file, set `HOME` and `DOTFILES_DRY_RUN=1` first.

### A setup script runs during `bun test`

Files named `*setup.ts` anywhere except `lib/` and `tests/` are found by the
runner. Do not name a helper `setup.ts` or `*setup.ts` in other directories.

### TypeScript: `Cannot find module 'bun'`

Run `bun install` (it installs `@types/bun`), then `bun run typecheck`.

## Still stuck?

Collect this and open an issue:

```bash
bun bootstrap.ts --dry-run --verbose --only <name> 2>&1 | tee /tmp/dotfiles.log
cat /etc/os-release
bun --version
```

Remove tokens and passphrases from the log before you share it.
