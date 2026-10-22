# lotus

Installs the [fcitx5-lotus](https://fcitx5-lotus.pages.dev) Vietnamese input
method from its apt repository, and sets the input method environment variables
in `~/.bash_profile` / `~/.zprofile`.

- The repository key and list are written only when they differ.
- Installation is skipped when the package is already installed (`--force` runs
  it again). The environment variables are always checked and added once.
