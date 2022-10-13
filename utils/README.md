# utils

This directory contains utility scripts used by this project.

## Getting Started

- `crypto.sh`: This script contains functions to encrypt/decrypt files and
  directories using `gpg`.

- `functions.sh`: This script contains utility functions.

## Usage

### File `crypto.sh`

- Function `endot`:

  - Description:

    - Archive the `src` directory to a tar file (`dstTarFile.gpg`), then encrypt
      it with `gpg` using `email`, which is `gpg` user id.
    - Archive file will exclude `setup.sh`, markdown files `(*.md)`, files with
      extension `.gpg`, and files with "`!`" prepended, e.g., `!foo.txt`.
    - The encrypted tar file will be created in the directory called the script.
    - The tar file will be deleted after the encryption process.

  - Usage:

    ```
    endot <email> <src> [dstTarFile]
    ```

    Parameters:

    - `email`: The recipient of a public-key encrypted document. The parameter
      name is either the name of the individual or the e-mail address of the
      individual to whom you are sending the message.
    - `src`: The directory will be archived and encrypted. The encrypted file
      will be created in **the directory called the script**.
    - `dstTarFile`: The file name of tar file that will be encrypted. The file
      name **MUST have the extension `.tar.gz` at the end**. The encrypted file
      will be created with the name `dstTarFile.gpg` **in the directory
      extracted from `dstTarFile`**. Default: `encrypted.tar.gz` (created in the
      directory called the script).

- Function `dedot`:

  - Description:

    - Decrypt the file from the encrypted file (by `gpg`), then extract it to
      the destination directory.
    - After extracting, it will remove the tar file.

    > **Warning**: This script will overwrite your existing files and directories
    > in the `dst` directory. So you should backup your existing files and directories
    > before running this.

  - Usage:

    ```
    dedot <src> <dst> <passphrase>
    ```

    Parameters:

    - `src`: The source file (encrypted by `gpg`) to decrypt. The file name
      should have the extension `.gpg` at the end.
    - `dst`: The destination directory to extract files to, create if it does
      not exist.
    - `passphrase`: The passphrase to decrypt the file. If not provided, it will
      be prompted.

- Function `exportSecretKey`:

  - Description:

    - Export `gpg` secret keys to the file.

    > **Note**: This will export all necessary information to restore the secrets
    > keys including the trust database information

    > **Warning**: This will export all secret keys, so you should keep this
    > file safe.

  - Usage:

    ```
    exportSecretKey <email> [backupFileName]
    ```

    Parameters:

    - `email`: The recipient of a public-key encrypted document. The parameter
      name is either the name of the individual or the e-mail address of the
      individual to whom you are sending the message.
    - `backupFileName`: The file name of exported gpg keys. Default:
      `secret.asc`.

- Function `exportPublicKey`:

  - Description:

    - Export `gpg` public key to file.

  - Usage:

    ```
    exportPublicKey <email> [backupFileName]
    ```

    Parameters:

    - `email`: The recipient of a public-key encrypted document. The parameter
      name is either the name of the individual or the e-mail address of the
      individual to whom you are sending the message.
    - `backupFileName`: The file name of exported gpg keys. Default:
      `public.asc`.

- Function `importKey`:

  - Description:

    - Import and restore `gpg` key from file.

    > **Note**: `gpg` prompt when importing keys will be suppressed by `--batch`
    > option.

  - Usage:

    ```
    importKey [backupFileName]
    ```

    Parameters:

    - `backupFileName`: The file name of exported gpg keys to import. Default:
      `secret.asc`.

### File `functions.sh`

- Print colors function:

  - Description:

    - Print colors to the terminal.
    - Text attributes:
      - `info`: bold, cyan foreground, and white background.
      - `success`: bold, green foreground and white background.
      - `warn`: bold, yellow foreground and white background.
      - `error`: bold, red foreground, and white background.

    > **Note**: These functions can be compressed to one line by using "`;`", so
    > you don't have to include file `functions.sh` to use these functions.
    >
    > <details open>
    > <summary><b>Example code</b></summary>
    >
    > ```bash
    > info() {
    >     tput bold;tput setaf "6";tput setab "7";echo "$1";tput sgr0;tput el;
    > }
    > ```
    >
    > </details>

  - Usage:

    ```
    info <msg>
    success <msg>
    warn <msg>
    error <msg>
    ```

    Parameters:

    - `msg`: Expression to print to the terminal.

- Function `pushLineNonDup`:

  - Description:

    - Push **a single line to the end of the file** if the line is not
      duplicated, create a new file if it does not exist.

  - Usage:

    ```
    pushLineNonDup <line> <file>
    ```

    Parameters:

    - `line`: The line to push to file.
    - `file`: The file to push the line.

- Function `startsudo`:

  - Description:

    - Prompt for sudo password.
    - This function will start a background job to keep the sudo privilege alive
      until the function `stopsudo` is called. It will also export a variable
      `SUDO_PID` to keep the background job's PID.
    - `INT` and `TERM` signals will be trapped to call `stopsudo` function.
    - If the user exit during the prompt, the function will return 1.

    > **Note**: It is recommended to use the `stopsudo` function to stop the
    > background job.

    > **Note**: You should have a guard if clause `[[ $? == 0 ]];` between
    > `startsudo` and `stopsudo` to check if the we got sudo privilege.
    >
    > <details open>
    > <summary><b>Example code</b></summary>
    >
    > ```bash
    > startsudo
    > if [[ $? == 0 ]]; then
    >     # Whatever you want to do with sudo
    > fi
    > stopsudo
    > ```
    >
    > </details>

  - Usage:

    ```
    startsudo
    ```

- Function `stopsudo`:

  - Description:

    - Stop the background job that keeps the sudo privilege alive and
      **invalidate the sudo privilege**.
    - This function will kill the background job with PID stored in `SUDO_PID`
      variable and unset the `SUDO_PID` variable so we won't kill it again.
    - It will also unset the `INT` and `TERM` signal traps.

  - Usage:

    ```
    stopsudo
    ```

- Function `symlink`:

  - Description:

    - Create a symbolic link to a file or directory.

  - Usage:

    ```
    symlink <src> <dst> [action]
    ```

    Parameters:

    - `src`: The source file or directory to create a symbolic link to.
    - `dst`: The destination symbolic link file or directory.
    - `action`: Backup, overwrite or skip if the `dst` file or directory already
      exists.

      - `B` **(default)**: Move the existing `dst` file or directory to
        `$HOME/.dotfiles_backup`.

        > **Note**: If the old backup file already exits in
        > `$HOME/.dotfiles_backup`, it will be deleted before backup to resolve
        > nested symlink problem.

      - `O`: Remove the existing `dst` file or directory and then overwrite.
      - `S`: Skip the existing `dst` file or directory.

- Function `installDotFiles`:

  - Description:

    - Use `symlink` function to create a symbolic link from dotfiles to **home
      directory**.
    - This function use `find` to find all files and directories in the source
      directory. **The maximum depth is 0**, so it will only create a symlink in
      the top directory not individual files within it.
    - File `setup.sh`, markdown files `(*.md)`, and files with "`!`" prepended
      within `dotfiles_dir` will be ignored, e.g., `!foo.txt`.

    > **Note**: This function will `cd` to `dotfiles_dir` directory before
    > running `find`, so you should be aware of your working directory after
    > running this function.

  - Usage:

    ```
    installDotFiles <dotfiles_dir> <action>
    ```

    Parameters:

    - `dotfiles_dir`: The directory that contains dot files to create a symbolic
      link to.
    - `action`: Backup or overwrite if the file or directory already
      exists in `$HOME` directory. Please refer to `symlink` function for more
      details about this parameter.
