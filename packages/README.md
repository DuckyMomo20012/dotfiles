# packages

This directory will install packages or tools that I use.

## Description

> **Note**: The file `setup.sh` in this directory will run first to install the
> necessary packages for other directories to run.

The `setup.sh` file will find text files `*.txt` to try to install packages with
its file name.

First, it will extract the install command from the file name, which is between
a pair of `$*_` (**optional**) and an extension end with `.txt` (`.txt` is
**required**). For example, with the file name `$1_sudo apt-get install.txt`, it
will extract `sudo apt-get install` as the install command.

Then, it will read the file line by line and try to install each package with
the extracted command. An empty line or line starting with `#` will be ignored.

**File name pattern**:

- The file name should be start with pattern `$*_` (**optional**); `*` is any
  character, e.g. `$1_`, `$a_`, `$ab_`, etc. Only the **FIRST** pattern is
  removed from the file name. For example, `$1_some command $1_$a_.txt`, then
  the extracted command is `some command $1_$a_`, the first pattern `$1_` is
  removed from the file name, but the pattern `$1_$a_` in the file name is not
  removed.

- About file extension, it **MUST** end with `.txt`. For example, `foo.txt`,
  `foo bar.deps.txt`, etc. The extension will be cut off from the **FIRST** dot
  `.`, so with `$1_some command.bar.txt`, the command will be `some command`,
  and the `.bar.txt` extension is cut off.

**Installation order**:

- The order will base on the result of the `find` command. For example:

  ```
  $ find * -name "*.txt" -type f

  # The installation process will run in this order:
  $1_sudo apt-get install.deps.txt <-- Install first
  $2_sudo apt-get install.txt
  $3_npm i -g.txt
  $4_sudo snap install.txt
  $aa_cmd.txt
  $ab_cmd.txt
  $a_cmd.txt
  $az_cmd.txt
  $ba_cmd.txt
  $bb_cmd.txt
  $b_cmd.txt
  $z_cmd.txt <-- Install last
  ```

Finally, it will run script files:

- `setup.sh` will find all script files `*.sh` in the `packages` directory and
  run it.

- Each package setup file should be named as `<package>.setup.sh`, for example:
  `nodejs.setup.sh` or `python.setup.sh`.

## Usage

Run `setup.sh` to install packages:

> **Warning**: This will change the `npm` default directory to `~/.npm-global`.

```bash
./setup.sh
```
