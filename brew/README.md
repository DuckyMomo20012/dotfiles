# brew

Installs [Homebrew](https://brew.sh) for Linux and the packages listed in
[`Brewfile`](./Brewfile).

- Homebrew is installed only when missing (`--force` reinstalls it).
- The brew `PATH` line is added to your shell config once.
- `brew bundle` installs what is in `Brewfile` and skips what is installed. An
  empty `Brewfile` (or one with only comments) is skipped.

Add formulae the usual way:

```ruby
brew "jq"
cask "visual-studio-code"
```
