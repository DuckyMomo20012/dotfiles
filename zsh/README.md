# zsh

This directory setup [zsh](https://www.zsh.org/), with
[oh-my-zsh](https://ohmyz.sh/).

## Getting Started

The `setup.sh` will run to install `zsh` with `apt-get`, and change the default
shell to `zsh`. The `.zhrc` file in the `dotfiles` directory will be symlinked
to `~/.zshrc`.

About `oh-my-zsh`, the directory `.oh-my-zsh` will be installed to
`~/.oh-my-zsh` by default. You can change the `ZSH` variable in the file
`setup.sh` to change the installation directory.

The file `.shell.pre-oh-my-zsh` and `.zshrc.pre-oh-my-zsh` in the `backup`
directory is backup files of `.zshrc` and `.shell` before installing
`oh-my-zsh`.

## Usage

Run `setup.sh` to setup `zsh`:

```bash
./setup.sh
```
