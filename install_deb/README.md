# install_deb

Put `.deb` files in this directory (they are git-ignored) and they are installed
with apt, so dependencies are resolved.

- Only this directory is searched, nothing else in the repository.
- A package whose exact version is already installed is skipped, so re-running is
  cheap and does not reinstall anything.
