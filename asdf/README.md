# asdf

This directory will set up the `asdf` tool version manager and install plugins.

## Getting Started

First, `setup.sh` will install `asdf` following the [official
guide](https://asdf-vm.com/guide/getting-started.html).

Then, it will install plugins:

- `setup.sh` will find all script files `*.sh` in the `asdf` directory and run
  it.

- Each plugin setup file should be named as `<plugin>.setup.sh`, for example:
  `nodejs.setup.sh` or `python.setup.sh`.

- Note that each plugin will have some dependencies, these dependencies should
  be added in the `packages` directory.

## Usage

Run `setup.sh` to setup `asdf` and install plugins:

```bash
./setup.sh
```
