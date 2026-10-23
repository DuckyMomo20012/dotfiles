# Private files: the full workflow

Some dotfiles must not be public: tokens, `~/.git-credentials`, personal config.
This project keeps them in `private/`, encrypted with your GPG key. Only the
encrypted archive `private/encrypted.tar.gz.gpg` is committed.

This guide covers the whole life cycle, once and then for every machine:

1. [How it is organised](#1-how-it-is-organised)
2. [Create a GPG key and back it up](#2-create-a-gpg-key-and-back-it-up)
3. [Add private files](#3-add-private-files)
4. [Encrypt and commit](#4-encrypt-and-commit)
5. [Restore on a new machine](#5-restore-on-a-new-machine)
6. [Day to day: edit, rotate a token](#6-day-to-day-edit-rotate-a-token)
7. [Safety checklist](#7-safety-checklist)

## 1. How it is organised

```text
private/
├── .gitignore                   ignores everything except the lines below
├── README.md                    committed
├── update-token.sh              committed
├── encrypted.tar.gz.gpg         committed (the encrypted archive)
├── dotfiles-example/            committed: an example of the layout below
│   ├── !.git-credentials        files starting with "!" are committed, never linked
│   ├── !.gitconfig.local
│   ├── !.wakatime.cfg
│   ├── !setup.ts
│   └── README.md
│
├── dotfiles/                    NOT committed (git-ignored), real private files
│   ├── .git-credentials
│   ├── .gitconfig.local
│   ├── .wakatime.cfg
│   └── setup.ts                 optional: private setup, runs with --dedot
└── setup.ts                     optional, same idea at the top level
```

Rules:

- Everything in `private/` is git-ignored except `README.md`, `update-token.sh`,
  `.gitignore`, `*.gpg` and files starting with `!`.
- `private/dotfiles/` has the same layout as the public `dotfiles/`:
  `private/dotfiles/.config/app/token` becomes `~/.config/app/token`.
- Files starting with `!` are examples. They are never linked, never run and
  never put in the archive.
- Markdown files, `*.gpg` files and `*.backup*` files are not put in the
  archive.

## 2. Create a GPG key and back it up

Skip this if you already have a key.

```bash
gpg --full-generate-key          # RSA 4096 or ed25519, set an email and a passphrase
gpg --list-secret-keys --keyid-format long
```

Back up the secret key. **Without this file the archive can never be decrypted on
a new machine.**

```bash
bun gpg/export.ts --email you@example.com --file ~/secret.asc
# Exported GPG key for you@example.com to /home/you/secret.asc
stat -c %a ~/secret.asc          # 600: only you can read it
```

Store `secret.asc` somewhere safe and offline (password manager attachment,
encrypted USB drive). Never commit it. Set the email once for all gpg scripts:

```bash
export GPG_EMAIL=you@example.com
```

## 3. Add private files

Copy the example and remove the `!`:

```bash
mkdir -p private/dotfiles
cp 'private/dotfiles-example/!.git-credentials' private/dotfiles/.git-credentials
cp 'private/dotfiles-example/!.gitconfig.local' private/dotfiles/.gitconfig.local
cp 'private/dotfiles-example/!setup.ts'        private/dotfiles/setup.ts
$EDITOR private/dotfiles/.git-credentials
```

`private/dotfiles/setup.ts` links the files in its own directory into `$HOME`
(see [`private/dotfiles-example/!setup.ts`](../private/dotfiles-example/!setup.ts)):

```ts
import { resolve } from 'node:path'
import { getHome, logger, symlinkDotfileDir } from '../../lib/utils'

logger.info('Symlink private dotfiles...')

const privateDir = resolve(__dirname)

await symlinkDotfileDir(privateDir, getHome(), privateDir)
```

Adjust the relative import to where the file lives (`../lib/utils` from
`private/setup.ts`). You do not need a `setup.ts` just to link files:
`bootstrap.ts --dedot` already links `private/dotfiles/` by itself. Use it for
extra work, for example setting permissions:

```ts
import { chmod } from 'node:fs/promises'
import { join } from 'node:path'
import { getHome } from '../../lib/utils'

await chmod(join(getHome(), '.git-credentials'), 0o600)
```

To keep a `setup.ts` in git (not recommended: it is encrypted anyway), see the
`.gitignore` hints in [`private/README.md`](../private/README.md).

## 4. Encrypt and commit

```bash
bun gpg/endot.ts --email you@example.com
# Encrypting /tmp/endot-XXXX/encrypted.tar.gz to .../private/encrypted.tar.gz.gpg for you@example.com...
# Encrypted ...
git add private/encrypted.tar.gz.gpg
git commit -m "private: update encrypted files"
```

Preview with `--dry-run`: the tarball is built in a temp directory, nothing is
written to `private/`.

Good to know:

- The archive is made from `private/` (override with `--dest`). It leaves out
  markdown files, `*.gpg`, `*.backup*` and every `!` file.
- The `.gpg` file changes on every run, even when the content is the same
  (encryption is randomised). Only run it when you changed something.
- Check what is inside without extracting to `private/`:

  ```bash
  gpg --decrypt private/encrypted.tar.gz.gpg | tar -tzf -
  ```

## 5. Restore on a new machine

Option A, everything in one command:

```bash
cd ~/dotfiles
export GPG_PASSPHRASE='the-passphrase-of-your-key'
bun bootstrap.ts --dedot --secret ~/secret.asc --email you@example.com
```

This runs the normal setup and then:

1. imports the key (skipped if the secret key is already in the keyring),
2. decrypts the archive in a temp directory and merges it into `private/`,
3. symlinks `private/dotfiles/*` into `$HOME`,
4. runs the setup files in `private/`.

Option B, the fresh machine wrapper (also installs `.deb` files):

```bash
./bootstrap.sh --dry-run        # preview
./bootstrap.sh                  # run (see examples/bootstrap.sh for variables)
```

Option C, only the private part, step by step:

```bash
bun gpg/import.ts --file ~/secret.asc --email you@example.com
bun gpg/dedot.ts                         # decrypt into private/
bun private/dotfiles/setup.ts            # link (if you have a private setup)
```

`GPG_PASSPHRASE` is the passphrase of the **archive's key**. Without it `gpg`
asks (it needs a terminal).

Running any of these twice is safe: files that did not change are not
rewritten, files that differ are backed up as `<file>.backup` (use
`--no-backup` to overwrite).

## 6. Day to day: edit, rotate a token

Because the private dotfiles are symlinks into `private/dotfiles/`, editing
`~/.gitconfig.local` edits the file in the repository. To publish a change:

```bash
bun gpg/endot.ts && git add private/encrypted.tar.gz.gpg && git commit -m "private: ..." && git push
```

Rotate a GitHub token in the two files that contain it:

```bash
cd private
./update-token.sh -t ghp_NEWTOKEN -b     # -b keeps *.bak copies of both files
cd .. && bun gpg/endot.ts
```

`update-token.sh` strips and re-adds the `ghp_` prefix, so it works with or without
it, and running it twice with the same token changes nothing. Delete the `.bak`
files afterwards (they are git-ignored, but they contain the old token).

Pull changes to the archive on another machine:

```bash
git pull && bun gpg/dedot.ts
```

## 7. Safety checklist

- `secret.asc` is stored offline and never committed.
- The key has a passphrase.
- `git status` shows only `private/encrypted.tar.gz.gpg` from `private/`.
- Use `GPG_PASSPHRASE` (environment) instead of `--passphrase` (visible in `ps`
  and shell history).
- After rotating a token, revoke the old one at the provider.
- `find ~ -name '*.backup*'` after a restore: backups of your old files may
  contain secrets. Delete them when you are done.
