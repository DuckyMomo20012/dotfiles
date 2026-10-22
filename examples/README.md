# examples

- [`bootstrap.sh`](./bootstrap.sh): wrapper for a fresh machine. Copy it next to
  your `secret.asc` and any `.deb` files and run it. It installs the `.deb`
  files, runs `install.sh` and then imports the GPG key and decrypts the private
  files. All options (`--dry-run`, `--no-backup`, ...) are passed through; see
  the header of the script for the environment variables.
