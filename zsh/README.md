# zsh

This directory setup [zsh](https://www.zsh.org/), with
[oh-my-zsh](https://ohmyz.sh/).

## Getting Started

The `setup.sh` will install:

- `zsh`: the shell. You can configure the `zsh` in the file `~/.zshrc`.
- `oh-my-zsh`: the framework for `zsh`.
  - This will be installed to `~/.oh-my-zsh` by default. You can change the
    `ZSH` variable in the file `setup.sh` to change the installation directory.
- `powerlevel10k`: the theme for `oh-my-zsh`. You can configure the theme in the
  file `~/.p10k.zsh`.
  - This will be installed to `~/.oh-my-zsh/themes/powerlevel10k` directory by
    default.

> The file `.shell.pre-oh-my-zsh` and `.zshrc.pre-oh-my-zsh` in the `backup`
> directory is backup files of `.zshrc` and `.shell` before installing
> `oh-my-zsh`.

## Usage

Run `setup.sh` to setup `zsh`:

```bash
./setup.sh
```
