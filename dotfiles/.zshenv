# Read by every zsh, before ~/.zshrc.
#
# Ubuntu/Debian: /etc/zsh/zshrc runs its own compinit before ~/.zshrc. zsh-autocomplete
# must own compinit, so skip the global one (required by the zsh-autocomplete README).
skip_global_compinit=1
