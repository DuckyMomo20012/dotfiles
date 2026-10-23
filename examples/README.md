# examples

## `bootstrap.sh`: fresh machine wrapper

For a machine with nothing on it. Copy the file next to the things you want to
bring along and run it:

```text
.
├── bootstrap.sh       <- this file
├── secret.asc         <- your GPG secret key (optional)
└── code_amd64.deb     <- any .deb to install first (optional)
```

```bash
./bootstrap.sh --dry-run          # preview (nothing is installed)
./bootstrap.sh                    # run
./bootstrap.sh --no-backup        # replace existing dotfiles without backups
```

### What it does

1. Installs every `*.deb` next to it (copied to a temp directory first, because apt
   cannot read private home directories), and pre-answers the VS Code
   repository question so nothing blocks.
2. Installs `curl` and `git`.
3. Downloads and runs `install.sh` with all your arguments: clones the repository
   to `~/dotfiles`, installs bun, runs `bun bootstrap.ts`.
4. When `secret.asc` exists: imports the key (`gpg/import.ts`, skipped when it is
   already in the keyring) and decrypts the private files (`gpg/dedot.ts`).
   Without the file it prints a warning and stops.

`--dry-run`, `--no-backup` and `--force` are passed to both `install.sh` and the
GPG steps.

### Variables

| Variable          | Default                             | Meaning                                                    |
| ----------------- | ----------------------------------- | ---------------------------------------------------------- |
| `GPG_EMAIL`       | (none)                              | Email of your key; lets the import be skipped when present |
| `GPG_PASSPHRASE`  | (none: gpg asks)                    | Passphrase of the encrypted archive                        |
| `GPG_SECRET_FILE` | `./secret.asc`                      | Path of the key file                                       |
| `DOTFILES_DIR`    | `~/dotfiles`                        | Where the repository is (must match `install.sh`)          |
| `INSTALL_URL`     | raw `install.sh` of the main branch | Use another fork or a local server                         |

Example, unattended:

```bash
GPG_EMAIL=you@example.com GPG_PASSPHRASE='...' ./bootstrap.sh --keep-going
```

### Safe to repeat

Every step checks first: `.deb` files whose version is installed are reinstalled
by apt as a no-op, `install.sh` fast-forwards the clone, the key import is skipped
when the key exists, and decrypting only writes files that differ (backing up the
ones you changed).

Note: `bootstrap.sh` decrypts the private archive but does not link
`private/dotfiles`. To link and run the private setup too, pass `--dedot` to
`bootstrap.ts` instead: `./bootstrap.sh --dedot --secret ./secret.asc --email you@example.com`
(then step 4 repeats harmlessly).
