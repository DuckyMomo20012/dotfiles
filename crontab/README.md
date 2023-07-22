# crontab

Import crontab files into the system.

## Description

The `setup.sh` will import the crontab files into the system.

## Usage

- File `setup.sh`: Add new user-defined cronjobs to the system.

  - Description:

    - Export current crontab to a temporary file `crontab.txt`, then add new
      user-defined cronjobs to the file and finally import the file to the
      system. The temporary file `crontab.txt` will be deleted after the import.
    - Default backup cronjobs before adding new cronjobs. Default:
      `crontab.bak`.
      - If the backup file already exists, it will be overwritten.
      - If the backup file is empty (no cronjobs), it will be deleted.

  - Usage:

    ```
    ./setup.sh [-b | -h]
    ```

    Options:

    - `-b` (backup): Backup the current crontab file.
    - `-h` (help): Show help message.

- File `import.sh`: Import cronjobs from a file.

  - Description:

    - Import cronjobs from a file.

  - Usage:

    ```
    ./import.sh [-f <file> | -h]
    ```

    Options:

    - `-f <file>` (file): The file to import cronjobs from. Default:
      `crontab.txt`.
    - `-h` (help): Show help message.

- File `export.sh`: Export cronjobs to file.

  - Description:

    - Export cronjobs to file.

  - Usage:

    ```
    ./export.sh [-f <file> | -h]
    ```

    Options:

    - `-f <file>` (file): The file to export cronjobs to. Default:
      `crontab.txt`.
    - `-h` (help): Show help message.
