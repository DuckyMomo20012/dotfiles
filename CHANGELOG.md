# Changelog

## Overhaul: idempotent, safer, documented

No command, flag, file name or directory was removed or renamed: everything
that worked before still works. Existing `lib/utils` imports and function
signatures are unchanged (new parameters are optional).

### New

- `--dry-run`, `--no-backup`, `--force`, `--verbose` (also as `DOTFILES_*`
  environment variables) for `bootstrap.ts`, `install.sh`, every setup file and
  the `gpg` scripts. `bootstrap.ts` also got `--only`, `--skip` and
  `--keep-going`.
- `lib/` is split into small modules (still re-exported from `lib/utils.ts`),
  documented in `lib/README.md`.
- Unit tests (`bun test`), a CI workflow, `bun run lint|typecheck|test` scripts.
- Documentation: a guide set in `docs/` (getting started, recipes, how it works,
  private files, troubleshooting), a full helper reference in `lib/README.md`, a README
  for every directory, `examples/bootstrap.sh` (the fresh machine wrapper).
- `eslint.config.mjs`: the type-aware `no-floating-promises` rule is scoped to
  TypeScript files; it crashed ESLint on YAML (`.github/workflows/ci.yml`).

### Idempotency

- `symlinkDotfileDir`: correct links are left alone. Before, every run backed up
  the file again, copying the repository file over the real backup of your
  original file.
- `asdf plugin add` failed on the second run; plugins, versions and pins are now
  checked first.
- `misc/setup.ts` appended the audio option on every run; it is added once.
- Tools (`argocd`, `azure`, `helm`, `helmfile`, `k3d`, `kubectl`, `kustomize`, `uv`,
  `brew`, `asdf`, `docker`, `terraform`, `lotus`) are skipped when installed.
- zsh theme and plugins were deleted and cloned again every run; they are
  fast-forwarded now. `chsh` runs only when needed.
- `docker.setup.ts` failed on `apt-get remove` of packages that do not exist;
  only installed ones are removed.
- apt: only missing packages are installed, `apt-get update` runs at most once
  an hour (and right after a repository was added), repository keys/lists are
  rewritten only when they differ.
- `install.sh` fast-forwards an existing clone instead of failing on `git clone`.

### Fixes

- Backups are `rename`s, so binary files (fonts!) are no longer corrupted, and an
  older backup is never overwritten (`<file>.backup.<timestamp>` is used).
- `symlinkDotfileDir` without `ignorePath` stripped the first `.` of the path
  (`normalize('')` is `'.'`). Files outside the base path are skipped instead of
  being linked to odd places. This also fixes the `--dedot` link step, which
  pointed at `private/<file>` instead of `private/dotfiles/<file>`.
- Setup file discovery was in filesystem order and also ran `!setup.ts` examples
  and `private/**` setup files. It is deterministic now (`packages` first) and
  `private` runs only with `--dedot`.
- `install_deb` searched the current directory (the whole repository) instead of
  its own; downloads/installers no longer write `argocd-linux-amd64`, `kubectl` or
  `kustomize` into the working directory (temp directories are used).
- `snap.setup.ts` passed several packages as one argument.
- `nodejs.setup.ts` had an unterminated quote.
- `helmfile` extracted `LICENSE`/`README.md` into `~/.local/bin`; only the
  binary is installed.
- `install.sh` ignored its arguments although the README documented them. It also
  sourced `~/.bashrc` (does nothing in a non-interactive shell) and could not
  read prompts when piped from `curl`; both fixed.
- `bootstrap.ts` left the decrypted `encrypted.tar.gz` in `private/`; the plain
  tarball now only lives in a private temp directory.
- GPG passphrases go to `gpg` on stdin instead of the command line; exported
  secret keys are `chmod 600`; `import` is skipped when the key is present.
- `gpg/dedot.ts` wrote the plain tar next to the encrypted file and overwrote
  files in `private/`; it merges with backups now.
- Binaries are downloaded for the right CPU (`amd64`/`arm64`) and checksum
  verified where the project publishes one (`kubectl`, `argocd`).

### Behavior notes

- `*.backup` files are never linked into `$HOME`.
- Logging: warnings and errors go to stderr; no colors when output is piped or
  `NO_COLOR` is set.
- `apt-get` runs non-interactively (`DEBIAN_FRONTEND=noninteractive`) and waits
  for the dpkg lock. Set `DOTFILES_APT_INTERACTIVE=1` to get the old behavior.
- `bootstrap.ts` keeps your sudo session alive for the whole run (no-op for
  root).
- `package-lock.json` was removed: bun (`bun.lock`) is the package manager.
