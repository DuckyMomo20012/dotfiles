# How it works

This document explains what `bun bootstrap.ts` does, in which order, and the
rules that keep every script safe to run again and again. Read it when you want
to change the behavior or write your own setup file.

- [The big picture](#the-big-picture)
- [Run order](#run-order)
- [Finding setup files](#finding-setup-files)
- [One process per setup file](#one-process-per-setup-file)
- [Global switches](#global-switches)
- [Symlinks and backups](#symlinks-and-backups)
- [Idempotency, tool by tool](#idempotency-tool-by-tool)
- [Dry run](#dry-run)
- [sudo and root](#sudo-and-root)
- [Errors and exit codes](#errors-and-exit-codes)
- [Secrets](#secrets)
- [Design decisions](#design-decisions)

## The big picture

```text
install.sh ──► bun bootstrap.ts ──┬─► asdf/*            (phase 1)
 (clone/update repo,              ├─► every other *setup.ts   (phase 2)
  install bun)                    ├─► dotfiles/ ──symlink──► ~   (phase 3)
                                  └─► --dedot only: private/   (phase 4)
                                         gpg import ► decrypt ► symlink ► private setup files
```

Everything is TypeScript run by [bun](https://bun.sh). There is no build step.
The code that is shared lives in [`lib/`](../lib/README.md); `bootstrap.ts` and
the `*setup.ts` files are thin scripts on top of it.

## Run order

| Phase | What                                | Where                                    | Notes                                                                     |
| ----- | ----------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| 0     | sudo keep-alive                     | `startSudo()`                            | Skipped for root, passwordless sudo and `--dry-run`.                      |
| 1     | asdf and its tools                  | `asdf/`                                  | First, because later files and your shell use asdf shims.                 |
| 2     | All other setup files               | every directory except `asdf`, `private` | Ordered, see below.                                                       |
| 3     | Symlink `dotfiles/` into `$HOME`    | `symlinkDotfileDir()`                    | After the tools are installed (the order the project always had).         |
| 4     | Private files (only with `--dedot`) | `private/`                               | Import key, decrypt, symlink `private/dotfiles`, run private setup files. |

Phase 2 ordering is deterministic (it used to depend on the filesystem):

1. Directories listed in `SETUP_PRIORITY` in `bootstrap.ts` come first, in that
   order: `packages`, `install_deb`, `brew`. They provide `curl`, `git`, build
   tools and Homebrew that the others use.
2. Remaining directories follow alphabetically: `devops`, `lotus`, `misc`,
   `zsh`.
3. Inside a directory, `setup.ts` runs first, then the `*.setup.ts` files
   alphabetically.

Need a different order? Change `SETUP_PRIORITY`, or give a directory a
`setup.ts` that does what must come first.

## Finding setup files

A setup file is any `*setup.ts` file. These are **not** setup files, even if the
name matches:

- anything in `node_modules` or `.git`;
- files whose name starts with `!` (disabled examples such as
  `private/dotfiles-example/!setup.ts`);
- everything in this repository's own `lib/` and `tests/` directories.

`--only` and `--skip` compare against the path relative to the repository, with a
plain "contains" test:

| Flag                       | Matches                                      |
| -------------------------- | -------------------------------------------- |
| `--only devops`            | every file under `devops/`                   |
| `--only devops/helm.setup` | only `devops/helm.setup.ts` (not `helmfile`) |
| `--skip docker`            | `devops/docker.setup.ts`                     |
| `--skip asdf`              | the whole asdf phase                         |
| `--only a --only b`        | files that contain `a` **or** `b`            |

## One process per setup file

`runSetupFilesInDir` starts `bun run <file>` for each setup file, with your
terminal attached (so `sudo` and `apt` can prompt). Reasons:

- A crash in one file cannot corrupt the state of the next.
- Every file can also be run alone: `bun devops/helm.setup.ts`.
- Environment variables are the only thing handed down. That is why
  `--dry-run` and friends are stored in `DOTFILES_*` variables.

By default the first failing file stops the run (`SetupFailedError`). With
`--keep-going` the remaining files run and the failures are listed at the end;
the exit code is `1` either way.

## Global switches

| Flag          | Variable             | Effect                                                               |
| ------------- | -------------------- | -------------------------------------------------------------------- |
| `--dry-run`   | `DOTFILES_DRY_RUN`   | Describe every change instead of making it.                          |
| `--no-backup` | `DOTFILES_NO_BACKUP` | Replace files directly instead of renaming them to `*.backup`.       |
| `--force`     | `DOTFILES_FORCE`     | Reinstall tools that exist; refresh apt lists; import GPG key again. |
| `--verbose`   | `DOTFILES_VERBOSE`   | Print each command (including read-only probes) and full stacks.     |

A value of `0`, `false`, `no`, `off` or an empty string means "off".

Every script that imports `lib/utils` understands the long flags, even without
declaring them: `bun misc/setup.ts --dry-run` works.

## Symlinks and backups

`symlinkDotfileDir(sourceDir, targetDir, ignorePath?)` handles each file with
`linkFile`. The decision tree for one file:

```text
target does not exist ─────────────────────────────► create link            (created)
target resolves to the same file as source ────────► do nothing             (unchanged)
target is a regular file with identical content ───► replace by link         (overwritten, nothing lost)
anything else is in the way
   ├─ backups on  ───────────────────────────────────► rename to <target>.backup, create link (backed-up)
   ├─ backups off, file or symlink ──────────────────► delete it, create link    (overwritten)
   └─ backups off, directory ───────────────────────► error, never deletes a directory
```

Details worth knowing:

- **Backups are renames**, so contents, permissions and symlinks stay exactly as
  they were. The old implementation copied the file as text, which corrupted
  binary files such as fonts.
- **Backups never overwrite each other.** The first backup is
  `<file>.backup`. If that exists, the next is `<file>.backup.<timestamp>`
  (`20261022044159`), and so on.
- **A correct link is never touched**, so running the script a hundred times
  creates no extra backups.
- **Same file through a symlinked parent** counts as unchanged. If `~/.config`
  itself is a symlink into this repository, linking into it will not delete
  your repository file.
- **What is not linked**: names starting with `!`, `*.md`, names containing
  `setup`, and `*.backup` (including timestamped ones).
- **Files outside the base path are skipped.** The base is `ignorePath`, or the
  source directory when you do not pass one.

The layout of the target follows the layout of the source:

```text
dotfiles/.zshrc                      ──►  ~/.zshrc
dotfiles/.config/foo/config.toml     ──►  ~/.config/foo/config.toml
dotfiles/.fonts/Monaspace/...        ──►  ~/.fonts/Monaspace/...
dotfiles/README.md                   ──►  (not linked)
```

## Idempotency, tool by tool

"Idempotent" here means: after one successful run, running again changes
nothing and does not fail. What each script checks:

| Script                                     | Check before acting                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `packages/apt.setup.ts`                    | `dpkg-query` per package; `apt-get update` only when lists are older than 1 hour                       |
| `packages/flathub.setup.ts`                | packages as above; `flatpak remote-add --if-not-exists`                                                |
| `packages/fuse.setup.ts`                   | skipped when `libfuse2` or `libfuse2t64` is installed                                                  |
| `packages/npm.setup.ts`                    | `mkdir -p`; each config line appended only if missing                                                  |
| `packages/snap.setup.ts`                   | `snap list <pkg>` per package; skipped when snap is missing                                            |
| `packages/uv.setup.ts`                     | `uv` on `PATH` or in `~/.local/bin`                                                                    |
| `asdf/setup.ts`                            | `asdf` on `PATH` or in `~/.asdf/bin`                                                                   |
| `asdf/*.setup.ts`                          | `asdf plugin list`, then `asdf where <plugin> <version>`, then pin and reshim                          |
| `brew/setup.ts`                            | `brew` on `PATH` or in `/home/linuxbrew`; `brew bundle` skips installed; empty Brewfile skipped        |
| `devops/argocd`, `kubectl`                 | command on `PATH`; downloads verified against the published SHA-256                                    |
| `devops/helm`, `k3d`, `azure`, `kustomize` | command on `PATH`                                                                                      |
| `devops/helmfile`                          | command on `PATH` or in `~/.local/bin`                                                                 |
| `devops/docker`                            | `docker-ce` installed; conflicting packages removed only if installed; group checked with `id -nG`     |
| `devops/terraform`                         | `terraform` installed; repo files rewritten only when different; offline keeps existing repo file      |
| `lotus/setup.ts`                           | `fcitx5-lotus` installed; env lines appended once                                                      |
| `misc/setup.ts`                            | `timedatectl show -p LocalRTC`; modprobe line appended once through `appendRootLine`                   |
| `zsh/setup.ts`                             | `aptInstall`; login shell from `getent passwd`; `~/.oh-my-zsh` exists; `git pull --ff-only` for clones |
| `install_deb/setup.ts`                     | `dpkg-deb -f` version compared with the installed version                                              |
| `bootstrap.ts` symlinks                    | see [Symlinks and backups](#symlinks-and-backups)                                                      |
| `bootstrap.ts --dedot`                     | key skipped when already in keyring; files merged only when different                                  |
| `install.sh`                               | `git pull --ff-only` instead of `git clone`; `bun` only installed when missing                         |

`--force` turns "skip when installed" into "reinstall".

## Dry run

`--dry-run` makes the library describe instead of act:

| Helper                                                | In dry run                                     |
| ----------------------------------------------------- | ---------------------------------------------- |
| `exec`, `bash`                                        | prints `[dry-run] $ <command>`                 |
| `download`, `githubLatestAsset`                       | prints what it would fetch; no network call    |
| `appendUniqueLine`, `writeRootFile`, `appendRootLine` | prints the change; no write                    |
| `linkFile`, `symlinkDotfileDir`, `mergeDir`           | prints link/backup/copy; no change             |
| `gpgDecrypt`, `gpgEncrypt`, `gpgExport`, `gpgImport`  | prints the gpg command; no key or file touched |
| `gitCloneOrUpdate`                                    | prints `git clone`                             |
| `capture`, `succeeds` (read-only probes)              | **still run**, so decisions are realistic      |

Because probes still run, a dry run on a configured machine shows (almost)
nothing to do, and on a fresh one shows everything.

## sudo and root

- Commands that need privileges are written as `['sudo', ...]`. When you are
  root, `exec` drops the leading `sudo` (containers often lack it).
- Shell snippets use `${SUDO}`, which is empty for root.
- `startSudo()` asks for the password once, refreshes it every 4 minutes
  and runs `sudo -k` when the process exits or is interrupted.
- Root-owned files are written with `sudo install` from a private temp file, and
  only when the content differs (`writeRootFile`).

## Errors and exit codes

- Helpers throw. `lib/utils` installs a handler that prints
  `Error: <message>` (a stack with `--verbose`) and exits non-zero.
- A failed command exits with the command's own exit code when it has one,
  otherwise `1`.
- `bootstrap.ts` exits `1` when any setup file failed.
- Network operations (`download`, release lookups) retry 3 times with growing
  pauses.
- Downloads are written to `<file>.partial` and renamed on success, so an
  interrupted download never leaves a half file that looks complete.

## Secrets

- The plain tarball of the private files exists only in a private (`0700`) temp
  directory and is always deleted.
- Passphrases are passed to `gpg` on stdin (`--passphrase-fd 0`), not as an
  argument, so they do not show up in `ps`. Prefer `GPG_PASSPHRASE` over
  `--passphrase` for the same reason.
- Exported secret keys are `chmod 600`.
- `private/.gitignore` ignores everything except the encrypted archive, READMEs,
  `update-token.sh` and files starting with `!`.

## Design decisions

| Decision                      | Why                                                                      | Alternative and why not                                              |
| ----------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| TypeScript on bun             | Real data structures, tests, one language, fast start, no build step.    | Bash: hard to test, fragile quoting. Ansible: heavy for one machine. |
| Symlinks into the repo        | Edit in place, `git diff` shows your changes, easy to roll back.         | Copying: drifts. GNU Stow: another dependency, no backup logic.      |
| One process per setup file    | Isolation and the ability to run each file alone.                        | In-process import: one crash ends everything.                        |
| Backup by renaming            | Exact and cheap; keeps modes and links.                                  | Copy + overwrite: corrupts binaries, loses older backups.            |
| Env vars for switches         | Cross-process, work in `curl \| bash`, scripts need no argument parsing. | Flags only: every script would have to forward them.                 |
| Check-then-act helpers        | Reruns are fast, work offline once installed, and cannot duplicate.      | Always reinstall: slow, network-bound, can break working tools.      |
| Lines appended, not templated | Compatible with lines already in your rc files.                          | Managed blocks: would duplicate existing lines on first run.         |

Known limits:

- Only Debian/Ubuntu family systems are supported for `apt` based scripts.
- Versions in `asdf/*.setup.ts` and `dotfiles/.tool-versions` are two copies of
  the same information; keep them in sync.
- `--force` does not remove anything, it re-runs installers.
- Encrypting the private archive is not reproducible: the `.gpg` file changes on
  every `endot.ts` run even if the content did not.
