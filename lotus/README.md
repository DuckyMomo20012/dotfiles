# lotus

Installs the [fcitx5-lotus](https://fcitx5-lotus.pages.dev) Vietnamese input
method from its apt repository and sets the environment variables the input
method needs.

## What runs

`setup.ts`:

1. When the package `fcitx5-lotus` is not installed (or with `--force`):
   - writes the repository key to `/etc/apt/keyrings/fcitx5-lotus.gpg`,
   - writes `/etc/apt/sources.list.d/fcitx5-lotus.list` for your Ubuntu codename,
   - runs `apt-get update` and installs `fcitx5-lotus`.
     Key and list are rewritten only when their content differs.
2. Adds these lines, once, to `~/.bash_profile` and `~/.zprofile` (only for a
   shell whose rc file `~/.bashrc` / `~/.zshrc` exists):

   ```bash
   export XMODIFIERS=@im=fcitx
   export QT_IM_MODULE=fcitx
   export QT_IM_MODULES="wayland;fcitx"
   export GLFW_IM_MODULE=ibus
   ```

## Run it

```bash
bun lotus/setup.ts --dry-run
bun bootstrap.ts --only lotus
```

Log out and in afterwards, then add Lotus in _Settings > Keyboard > Input Sources_
(or `fcitx5-configtool`).

## Second run

```text
Installing lotus...
fcitx5-lotus is already installed, skipping (use --force to reinstall).
Setup lotus environment variables
```

## Troubleshooting

- `404` for the repository: your codename may not be published yet. Check
  `https://fcitx5-lotus.pages.dev/apt/<codename>/`. On a derivative the Ubuntu
  codename is read from `UBUNTU_CODENAME` in `/etc/os-release`.
- Input method not active: the variables are read at login; log out and in.
