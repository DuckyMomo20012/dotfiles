<div align="center">

  <h1>dotfiles</h1>

  <p>
    My custom dotfiles for Linux
  </p>

<!-- Badges -->
<p>
  <a href="https://github.com/DuckyMomo20012/dotfiles/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/DuckyMomo20012/dotfiles" alt="contributors" />
  </a>
  <a href="">
    <img src="https://img.shields.io/github/last-commit/DuckyMomo20012/dotfiles" alt="last update" />
  </a>
  <a href="https://github.com/DuckyMomo20012/dotfiles/network/members">
    <img src="https://img.shields.io/github/forks/DuckyMomo20012/dotfiles" alt="forks" />
  </a>
  <a href="https://github.com/DuckyMomo20012/dotfiles/stargazers">
    <img src="https://img.shields.io/github/stars/DuckyMomo20012/dotfiles" alt="stars" />
  </a>
  <a href="https://github.com/DuckyMomo20012/dotfiles/issues/">
    <img src="https://img.shields.io/github/issues/DuckyMomo20012/dotfiles" alt="open issues" />
  </a>
  <a href="https://github.com/DuckyMomo20012/dotfiles/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/DuckyMomo20012/dotfiles.svg" alt="license" />
  </a>
</p>

<h4>
    <a href="https://github.com/DuckyMomo20012/dotfiles/">View Demo</a>
  <span> · </span>
    <a href="https://github.com/DuckyMomo20012/dotfiles">Documentation</a>
  <span> · </span>
    <a href="https://github.com/DuckyMomo20012/dotfiles/issues/">Report Bug</a>
  <span> · </span>
    <a href="https://github.com/DuckyMomo20012/dotfiles/issues/">Request Feature</a>
  </h4>
</div>

<br />

<!-- Table of Contents -->

## :notebook_with_decorative_cover: Table of Contents

- [About the Project](#star2-about-the-project)
  - [Features](#dart-features)
- [Documentation](#books-documentation)
- [Getting Started](#toolbox-getting-started)
  - [Prerequisites](#bangbang-prerequisites)
  - [Run Locally](#running-run-locally)
- [Usage](#eyes-usage)
  - [Options](#gear-options)
  - [Idempotency and backups](#recycle-idempotency-and-backups)
  - [Project Structure](#card_index_dividers-project-structure)
  - [Fresh Machine Setup](#beverage_box-fresh-machine-setup)
  - [Adding a tool](#hammer_and_wrench-adding-a-tool)
- [Development](#test_tube-development)
- [Roadmap](#compass-roadmap)
- [Contributing](#wave-contributing)
- [FAQ](#grey_question-faq)
- [License](#warning-license)
- [Contact](#handshake-contact)
- [Acknowledgements](#gem-acknowledgements)

<!-- About the Project -->

## :star2: About the Project

<!-- Features -->

### :dart: Features

> **Warning**: Use at your own risk. Please acknowledge for what you are copying
> and what you are using it for.

- Easy to install packages: one command sets up a whole machine.
- **Safe to run again and again.** Every script detects finished work and skips
  it, so you can re-run after a failure or after changing the repository.
- **Nothing is lost.** Existing files are backed up before they are replaced,
  or replaced directly with `--no-backup`.
- **Preview first** with `--dry-run`: it prints every change and makes none.
- Secure your dotfiles in the `private` folder (encrypted with `gpg`).
- Easy to add your specific tools, see [Adding a tool](#hammer_and_wrench-adding-a-tool).
- Written in TypeScript and run with [bun](https://bun.sh).

<!-- Documentation -->

## :books: Documentation

| Read this                                            | When you want to                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| [docs/getting-started.md](./docs/getting-started.md) | Set up a machine end to end: preview, run, verify, update, undo   |
| [docs/recipes.md](./docs/recipes.md)                 | Copy-paste solutions: add a tool, undo, servers, CI               |
| [docs/how-it-works.md](./docs/how-it-works.md)       | Understand the run order, idempotency rules, backups, dry run     |
| [docs/private-files.md](./docs/private-files.md)     | Keep secrets encrypted: key, archive, new machine, token rotation |
| [docs/troubleshooting.md](./docs/troubleshooting.md) | Fix an error message                                              |
| [lib/README.md](./lib/README.md)                     | Write or change a setup script; reference of every helper         |
| [gpg/README.md](./gpg/README.md)                     | Use the encrypt/decrypt/export/import scripts                     |
| [CHANGELOG.md](./CHANGELOG.md)                       | See what changed and why                                          |
| `<directory>/README.md`                              | Learn what one directory installs and how to customize it         |

<!-- Getting Started -->

## :toolbox: Getting Started

<!-- Prerequisites -->

### :bangbang: Prerequisites

- A Debian/Ubuntu based Linux with `apt`, and a user that can use `sudo` (or
  `root`).
- `curl` and `git`. `install.sh` installs them, plus `unzip`, if they are
  missing. [bun](https://bun.sh) is installed by `install.sh` too.

<!-- Run Locally -->

### :running: Run Locally

- **Run from script**:

  File `install.sh` clones this repository to `~/dotfiles` (or updates it when
  it is already there), installs `bun`, and runs `bun bootstrap.ts` with the
  arguments you pass:

  ```bash
  curl -fsSL https://raw.githubusercontent.com/DuckyMomo20012/dotfiles/main/install.sh | bash -s -- [options]
  ```

- **Run manually**:

  Clone the project and go to the project directory:

  ```bash
  git clone https://github.com/DuckyMomo20012/dotfiles.git ~/dotfiles
  cd ~/dotfiles
  ```

  Install `bun` if you do not have it ([bun.sh](https://bun.sh)), then run the
  bootstrap script:

  ```bash
  bun bootstrap.ts [options]
  ```

  Tip: look at what would happen first with `bun bootstrap.ts --dry-run`.

<!-- Usage -->

## :eyes: Usage

> **Note**: This project is tested on Ubuntu 22.04 and newer LTS releases. Other
> Debian based distributions should work, but are not tested.

`bun bootstrap.ts` does the following, in order:

1. Runs the setup files in [`asdf`](./asdf/) (the version manager and the tools
   it installs).
2. Runs all other setup files (`setup.ts` and `*.setup.ts`, in every
   directory). Directories run in a fixed order: `packages`, `install_deb` and
   `brew` first (they provide `curl`, `git`, build tools...), then the rest
   alphabetically. Inside a directory `setup.ts` goes first.
3. Symlinks everything in [`dotfiles`](./dotfiles/) into your home directory.
4. With `--dedot`: imports your GPG key, decrypts [`private`](./private/),
   symlinks `private/dotfiles` and runs the private setup files.

It stops at the first failing setup file (use `--keep-going` to run the rest
and get a report at the end).

### :gear: Options

```
Usage: bun bootstrap.ts [options]

  -h, --help          Show help and exit
  -d, --dedot         Decrypt and set up the private files
  -s, --secret <file> GPG secret key file to import (env: GPG_SECRET_FILE)
  -e, --email <email> Email of the GPG key (env: GPG_EMAIL)
  -p, --passphrase <passphrase>  Passphrase of the encrypted archive (env: GPG_PASSPHRASE)
  -n, --dry-run       Show what would change, change nothing
      --no-backup     Overwrite existing files directly instead of backing them up
      --force         Reinstall tools that are already installed
  -v, --verbose       Print every command that is run
      --only <name>   Run only setup files whose path contains <name> (repeatable)
      --skip <name>   Skip setup files whose path contains <name> (repeatable)
      --keep-going    Do not stop at the first failing setup file
```

Examples:

```bash
bun bootstrap.ts --dry-run                      # preview everything
bun bootstrap.ts --only devops --skip docker    # only DevOps tools, without docker
bun bootstrap.ts --no-backup                    # replace existing dotfiles directly
bun bootstrap.ts --force --only helm            # reinstall helm
```

A typical session:

```text
$ bun bootstrap.ts --dry-run          # 1. look
$ bun bootstrap.ts                    # 2. do it
$ bun bootstrap.ts                    # 3. again: nothing to do
Symlinks: 0 linked, 270 already up to date, 0 backed up
All done.
$ bun bootstrap.ts --force --only helm   # 4. reinstall one thing
```

Environment variables (all optional):

| Variable                                         | Same as / effect                                           |
| ------------------------------------------------ | ---------------------------------------------------------- |
| `DOTFILES_DRY_RUN=1`                             | `--dry-run`                                                |
| `DOTFILES_NO_BACKUP=1`                           | `--no-backup`                                              |
| `DOTFILES_FORCE=1`                               | `--force`                                                  |
| `DOTFILES_VERBOSE=1`                             | `--verbose`                                                |
| `GPG_EMAIL`, `GPG_SECRET_FILE`, `GPG_PASSPHRASE` | `--email`, `--secret`, `--passphrase`                      |
| `GITHUB_TOKEN`                                   | Avoid the GitHub API rate limit (asdf, helmfile downloads) |
| `DOTFILES_APT_INTERACTIVE=1`                     | Let apt ask questions (default: never ask)                 |
| `NO_COLOR=1`                                     | Plain output                                               |

Prefer `GPG_PASSPHRASE` over `--passphrase`: command line arguments are visible
to other users in `ps`.

Every single setup file understands `--dry-run`, `--no-backup`, `--force` and
`--verbose` too (`bun devops/helm.setup.ts --dry-run`). More about the shared
switches and the helper library in [`lib/README.md`](./lib/README.md).

### :recycle: Idempotency and backups

You can run any script as often as you like and get the same result.

- **Tools** are installed only when missing (`--force` reinstalls). apt
  packages are checked one by one, the package lists are refreshed at most once
  an hour, and repository files are rewritten only when their content differs.
- **Shell config** (`~/.bashrc`, `~/.zshrc`, ...) lines are appended only when
  they are not there yet, and only for shells you use.
- **Git clones** (zsh theme and plugins) are fast-forwarded, not deleted and
  cloned again.
- **Symlinks** that are already correct are left alone. When something else is
  in the way, it is moved to `<file>.backup` (an older backup is never
  overwritten: you get `<file>.backup.<timestamp>`) and the link is created.
  With `--no-backup` it is replaced directly. See
  [`lib/README.md`](./lib/README.md#symlinks-and-backups).
- **Private files** from the encrypted archive are written only when they
  differ, and the old version is backed up in the same way.
- **Nothing is left behind**: temporary files live in private temp directories
  that are always removed.

### :card_index_dividers: Project Structure:

- [`asdf`](./asdf/): Setup the `asdf` tool version manager and install plugins.
- [`brew`](./brew/): Setup Homebrew and install the packages of its `Brewfile`.
- [`devops`](./devops): Setup DevOps tools.
- [`dotfiles`](./dotfiles/): Dotfiles that are symlinked into the home directory.
- [`docs`](./docs/): Guides: getting started, recipes, how it works, private files, troubleshooting.
- [`examples`](./examples/): Wrapper script for a fresh machine.
- [`gpg`](./gpg/): Scripts to encrypt files in the `private` directory or
  export/import `gpg` keys.
- [`install_deb`](./install_deb/): Install the `.deb` files you put there.
- [`lib`](./lib/): Utility library for this project, with its own
  [documentation](./lib/README.md).
- [`lotus`](./lotus/): Setup `lotus` Vietnamese input method.
- [`misc`](./misc/): Miscellaneous system fixes.
- [`packages`](./packages/): Install packages.
- [`private`](./private/): Private dotfiles, will be ignored and encrypted.
  - [`private/dotfiles-example`](./private/dotfiles-example): Example private
    dotfiles configuration.
- [`tests`](./tests/): Unit tests of the library.
- [`zsh`](./zsh/): Setup `zsh` shell.

Directories that run something have a `README.md` that explains what it does and
how to customize it.

### :beverage_box: Fresh Machine Setup:

Assume your current directory has this structure (everything except
`bootstrap.sh` is optional):

```
.
├── bootstrap.sh       <- copy of examples/bootstrap.sh
├── secret.asc         <- GPG secret key
└── code_amd64.deb     <- any .deb you want installed first
```

Then run:

```bash
./bootstrap.sh
```

It installs the `.deb` files, runs `install.sh` (so every `bootstrap.ts` option
works: `./bootstrap.sh --dry-run`, `./bootstrap.sh --no-backup`), imports
`secret.asc` and decrypts the private files. Set `GPG_EMAIL` and
`GPG_PASSPHRASE` to avoid the prompts.

Without the wrapper, normal setup is:

```bash
curl -fsSL https://raw.githubusercontent.com/DuckyMomo20012/dotfiles/main/install.sh | bash -s
```

Or setup and decrypt the private files in one go:

```bash
export GPG_PASSPHRASE="your_passphrase"
curl -fsSL https://raw.githubusercontent.com/DuckyMomo20012/dotfiles/main/install.sh | bash -s -- --dedot --secret "secret.asc" --email "example@gmail.com"
```

### :hammer_and_wrench: Adding a tool

Create `<directory>/<tool>.setup.ts` (or `setup.ts` for the main file of a
directory). It is picked up automatically. Keep it idempotent: check before
you act, and use the helpers from [`lib`](./lib/README.md) so `--dry-run` and
`--no-backup` work. A complete example is in
[`lib/README.md`](./lib/README.md#writing-an-idempotent-setup-script).

<!-- Development -->

## :test_tube: Development

```bash
bun install        # dev tools (eslint, typescript)
bun run lint       # eslint
bun run typecheck  # tsc
bun test           # unit tests, use throwaway directories
bun run bootstrap:dry
```

`bun.lock` is the only lockfile. CI runs the same checks, plus ShellCheck and a
double dry run.

<!-- Roadmap -->

## :compass: Roadmap

- [x] Colorize output.
- [x] Idempotent setup scripts.
- [x] Backup or overwrite existing files.
- [x] Dry run.

<!-- Contributing -->

## :wave: Contributing

<a href="https://github.com/DuckyMomo20012/dotfiles/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=DuckyMomo20012/dotfiles" alt="contributors" />
</a>

Contributions are always welcome! Please run `bun run lint`, `bun run typecheck`
and `bun test` before you open a pull request.

<!-- FAQ -->

## :grey_question: FAQ

- Is this project still maintained?

  - Yes, I will add more dotfiles when I use new tools or have some
    modifications to my current dotfiles.

- Is this project support other Linux distributions or MacOS?

  - Debian and Ubuntu based systems are supported. On other systems the `apt`
    based scripts will not work; the rest may. Try it with `--dry-run` first.

- I ran it twice, did it duplicate anything?

  - No. See [Idempotency and backups](#recycle-idempotency-and-backups). If you
    find a script that is not safe to repeat, please open an issue.

- Where did my old `~/.zshrc` go?

  - To `~/.zshrc.backup` (or `~/.zshrc.backup.<timestamp>` when that name was
    taken). Use `--no-backup` if you do not want backups.

<!-- License -->

## :warning: License

Distributed under MIT license. See
[LICENSE](https://github.com/DuckyMomo20012/dotfiles/blob/main/LICENSE) for more
information.

<!-- Contact -->

## :handshake: Contact

Duong Vinh - [@duckymomo20012](https://twitter.com/duckymomo20012) -
tienvinh.duong4@gmail.com

Project Link:
[https://github.com/DuckyMomo20012/dotfiles](https://github.com/DuckyMomo20012/dotfiles).

<!-- Acknowledgments -->

## :gem: Acknowledgements

Here are useful resources and libraries that I have used in my projects:

- [Awesome Readme Template](https://github.com/Louis3797/awesome-readme-template):
  A detailed template to bootstrap your README file quickly.

- [rkalis/dotfiles](https://github.com/rkalis/dotfiles): A good dotfiles project
  that inspired me with the keep sudo alive approach, extract install command
  from file name and some other things.

- [holman/dotfiles](https://github.com/holman/dotfiles): Good folder structure
  and symlink approach.

- [explainshell.com](https://explainshell.com/): A website to explain shell
  commands.

- [ShellCheck](https://www.shellcheck.net/): Finds bugs in your shell scripts.

<!-- Ref: https://stackoverflow.com/questions/9725675/is-there-a-standard-format-for-command-line-shell-help-text -->

- [DOCOPT](http://docopt.org/): Command-line interface description language.

- [Command Line Interface Guidelines](https://clig.dev/): An open-source guide
  to help you write better command-line programs, taking traditional UNIX
  principles and updating them for the modern day.
