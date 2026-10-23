# install_deb

Installs the `.deb` files you put in this directory, with apt (so dependencies
are resolved from your repositories). The files are git-ignored (`*.deb`), so
nothing large or proprietary is committed.

## How to use

```bash
cp ~/Downloads/code_1.95.0_amd64.deb install_deb/
bun install_deb/setup.ts --dry-run          # preview
bun bootstrap.ts --only install_deb         # install
```

Example output:

```text
Found 1 .deb file(s):
- /home/you/dotfiles/install_deb/code_1.95.0_amd64.deb
Installing deb packages...
Installing: /home/you/dotfiles/install_deb/code_1.95.0_amd64.deb
Deb packages installed successfully.
```

Run again:

```text
code 1.95.0-1730000000 is already installed (/home/you/dotfiles/install_deb/code_1.95.0_amd64.deb).
Deb packages installed successfully.
```

## Rules

- Only this directory (and its sub directories) is searched. Before, the current
  working directory was searched, which could pick up unrelated `.deb` files.
- For each file, the `Package` and `Version` fields are read (`dpkg-deb -f`). A
  package whose exact version is installed is skipped; a newer or different
  version is installed.
- With no `.deb` file the script only prints a warning.
- `install_deb` runs right after `packages`, before the other directories.

## Alternative: `.deb` files next to `bootstrap.sh`

On a brand new machine, [`examples/bootstrap.sh`](../examples/bootstrap.sh)
installs the `.deb` files that sit next to it **before** the repository exists
(for example VS Code, so you have an editor immediately). Use that for things you
need before the clone, and this directory for things you want installed on every
run of the bootstrap.

## Troubleshooting

- `Unmet dependencies`: add the missing repository or run `sudo apt-get install -f`.
- `Download is performed unsandboxed as root`: harmless; it appears when the file is
  in a directory that user `_apt` cannot read (a private home directory).
