# completions

Register command completion scripts for `bash` shell.

## Description

The `setup.sh` will add completion scripts to the file `~/.bashrc`:

- File `npm.sh`:

  - Commands:

    - `npm {install | i | add | remove | rm | uninstall | un}`.
    - `yarn {install | i | add | remove | rm | uninstall | un}`.
    - `pnpm {install | i | add | remove | rm | uninstall | un}`.

    > **Note**: `install` is not a valid command for `yarn` and `pnpm` or `add`
    > is not a valid command for `npm`, but the completion script still works.
    > Because I'm just lazy to write a script to check the command 😅.

  - Description:

    - Search in current directory for all `package.json` files (not in
      `node_modules` directory), then register completions for `dependencies`
      and `devDependencies` packages specified in the file `package.json`, when
      command is `install`, `add`, `remove`. This completion is registered for
      the command `npm`, `yarn` and `pnpm`.

    - This script should be included in `~/.bashrc` file, so it will be executed
      when a new shell is started. Moreover, when the script is executed in
      `HOME` directory, it can find all `package.json` files in your system, and
      give you better completion.

  ***

  - Commands:

    - `npm`
    - `yarn`
    - `pnpm`

  - Description:

    - This is default case, so it will behave the same as the above case, but it
      will register completions for `scripts` in `package.json` file instead of
      the `dependencies` and `devDependencies`.

  ***

  - Usage:

    ```bash
    source ./npm.sh
    ```

## Usage

Run `setup.sh` to setup completions:

```bash
./setup.sh
```
