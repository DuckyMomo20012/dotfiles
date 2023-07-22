# asdf

This directory will set up the `asdf` tool version manager and install plugins.

## Description

1. Setup `asdf` version manager:

The `setup.sh` script will install `asdf` following the
[official guide](https://asdf-vm.com/guide/getting-started.html).

2. Install plugins:

Install plugins process will run in this order:

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
