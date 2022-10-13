# check-version

This directory will check the version from list of URLs.

## Getting Started

File `setup.sh` will read URLs from a text file, e.g., `website.txt`, crawl and check
the version of the website with pattern in that text file.

## Prerequisites

- A text (`.txt`) file:

  - A text file with URLs and pattern to check the version. This file is like a
    `csv` file, but without the header, each line is separated by a comma "`,`".

  - The header format:

    ```
    name,url,prefix,suffix,oldValue
    ```

    Headers:

    - `name`: Name of entry, this should be website name.
    - `url`: URL to check the version.
    - `prefix`: Prefix regex pattern before the version.
    - `suffix`: Suffix regex pattern after the version.
    - `oldValue`: Old version of the website to check.

    > **Warning**: Although the `prefix` and `suffix` are regex pattern, they
    > **MUST NOT** capture any group (with a parenthesis "`()`"). Why? **Because
    > the first group captures the version**.

    > **Note**: Any special characters (`^$|[]()\.*+?`) in the `prefix` and `suffix`
    > should be escaped with `\` character.

  - You should find **a unique sentence** in `url` content that has the
    [semver](https://semver.org/) version in it, e.g., "Download 16.17.1 LTS"
    (from [NodeJS](https://nodejs.org/en/)), then extract the `prefix` and
    `suffix` (any special characters should be escaped), so that we can match
    the version correctly.

  - Example:

    ```
    NodeJS,https://nodejs.org/en/,Download , LTS,16.17.1
    Python,https://www.python.org/downloads/,Download Python ,,3.10.8
    ```

    - The first line will find a version in "Download `...` LTS" and the
      compare with old version is `16.17.1`.

    - The second line will find a version in "Download Python `...`", because we
      don't have any `suffix` characters so we can skip it, and then compare with
      old version is `3.10.8`.

## Usage

- File `script.sh`: Check the version from list of URLs.

  - Description:

    - Read URLs from a text file, e.g., `website.txt`, crawl and check the version
      of the website with pattern in that text file.

  - Usage:

    ```
    ./script.sh [-f <file> | -b | -h]
    ```

    Options:

    - `-f <file>` (file): The text file to read URLs and pattern to check the
      version. Default: `website.txt`.
    - `-b` (backup): Backup the old version to `filename.bak` file.
    - `-h` (help): Show help message.

- Function `crawlAndCheck`: Crawl website content and check for new version changes.

  - Description:

    - Use `curl` to crawl website content, then combine the `prefix` and
      `suffix` with the `version` pattern to match the version in the content.

  - Usage:

    ```
    crawlAndCheck <name> <url> <prefix> <suffix> <oldValue> <websiteListFile> [action]
    ```

    Parameters:

    - `name`: Name of entry, this should be website name.
    - `url`: URL to check the version.
    - `prefix`: Prefix regex pattern before the version.
    - `suffix`: Suffix regex pattern after the version.
    - `oldValue`: Old version of the website to check.
    - `websiteListFile`: The text (`.txt`) file to read URLs and pattern to
      check the version.
    - `action`: Action to do when the version is changed.

      - `O` **(default)**: Overwrite the `oldVersion` in the text file.
      - `B`: Backup the old `websiteListFile` to `websiteListFile.bak` file.

      > **Note**: `sed` is used to update the `oldVersion` in the text file.
      > It will **match `oldValue` the exact entry in file**, because `name`,
      > `url`, `prefix`, `suffix` is also passed to `sed` as regex pattern, so
      > you don't have to worry it update the wrong entry.

    > **Warning**: Although the `prefix` and `suffix` are regex pattern, they
    > **MUST NOT** capture any group (with a parenthesis "`()`"). Why? **Because
    > the first group captures the version**.

    > **Note**: Any special characters (`^$|[]()\.*+?`) in the `prefix` and `suffix`
    > should be escaped with `\` character.
