# zsh

Installs zsh, makes it your login shell, and sets up
[oh-my-zsh](https://ohmyz.sh) with powerlevel10k, zsh-autosuggestions,
zsh-autocomplete and zsh-syntax-highlighting.

- The login shell is changed only when it is not zsh yet.
- oh-my-zsh is installed once; an existing `~/.zshrc` is kept.
- The theme and plugins are cloned once and fast-forwarded on later runs
  (a failed update, e.g. offline, only prints a warning).

The configuration itself lives in [`dotfiles/.zshrc`](../dotfiles/.zshrc) and
[`dotfiles/.p10k.zsh`](../dotfiles/.p10k.zsh).

`backup/` holds copies of the files oh-my-zsh saved when it was first installed.
They are not used by the scripts.
