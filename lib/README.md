# lib

Helper library used by `bootstrap.ts` and every `*setup.ts` file. Import
everything from one place:

```ts
import { appendToShellRc, aptInstall, logger, symlinkDotfileDir } from '../lib/utils'
```

`utils.ts` only re-exports the modules below, so older imports keep working.
Importing it also makes the script understand the global flags and print errors
as one readable line (full stack with `--verbose`).

## Global switches

| Flag          | Environment variable | Effect                                                     |
| ------------- | -------------------- | ---------------------------------------------------------- |
| `--dry-run`   | `DOTFILES_DRY_RUN`   | Log every change, perform none                             |
| `--no-backup` | `DOTFILES_NO_BACKUP` | Replace existing files directly instead of backing them up |
| `--force`     | `DOTFILES_FORCE`     | Reinstall tools that are already installed                 |
| `--verbose`   | `DOTFILES_VERBOSE`   | Print debug output, including every command that is run    |

`bootstrap.ts` turns its flags into these variables, so every setup file it
spawns follows them. A single script understands them too:
`bun devops/helm.setup.ts --dry-run`.

Other variables: `DOTFILES_APT_INTERACTIVE=1` lets apt ask questions again,
`GITHUB_TOKEN` avoids the GitHub API rate limit, `NO_COLOR` turns colors off.

## Modules

| Module         | What it gives you                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `constants.ts` | `ROOT_DIR`, `DOTFILES_DIR`, `PRIVATE_DIR`, `getHome()`, tool paths (`asdfBinPath`, `brewBinPath`, ...)                |
| `config.ts`    | `config` (read the switches above), `setConfig`, `configFromArgv`                                                      |
| `logger.ts`    | `logger.info/success/warn/error/debug/dryRun`; no colors when piped or `NO_COLOR` is set                               |
| `shell.ts`     | `exec`, `bash`, `capture`, `succeeds`, `download`, `githubLatestAsset`, `ensureInstalled`, `startSudo`, `withTempDir`... |
| `files.ts`     | `linkFile`, `symlinkDotfileDir`, `mergeDir`, `appendUniqueLine`, `backupFile`                                          |
| `shellrc.ts`   | `appendToShellRc`, `cobraCompletion`                                                                                   |
| `apt.ts`       | `aptInstall`, `aptUpdate`, `aptRemove`, `aptInstallDebFiles`, `ensureAptRepo`, `isPackageInstalled`, `prettyAptInstall` |
| `root.ts`      | `writeRootFile`, `appendRootLine`: change root-owned files only when needed                                            |
| `git.ts`       | `gitCloneOrUpdate`                                                                                                     |
| `asdf.ts`      | `asdfInstallTool`                                                                                                      |
| `gpg.ts`       | `gpgEncrypt`, `gpgDecrypt`, `gpgDecryptArchive`, `gpgExport`, `gpgImport`                                              |
| `runner.ts`    | `runSetupFilesInDir`, `findSetupFiles`                                                                                 |
| `cli.ts`       | `commonOptions`, `applyCommonOptions` for scripts that parse their own arguments                                       |
| `errors.ts`    | `CommandError`, `SetupFailedError`                                                                                     |

## Symlinks and backups

`symlinkDotfileDir(sourceDir, targetDir, ignorePath?, options?)` links every
file of `sourceDir` into `targetDir`. The path relative to `ignorePath` (default
`sourceDir`) decides where a file lands. Files that start with `!`, markdown
files, anything with `setup` in its name and `*.backup` files are skipped.

For each file:

| What is at the target                    | Result                                                           |
| ---------------------------------------- | ---------------------------------------------------------------- |
| Nothing                                  | Link is created (parent directories too)                         |
| The correct link already                 | Nothing happens, so repeated runs never make new backups         |
| A different file or link                 | Moved to `<file>.backup`, then linked                            |
| A different file and `--no-backup`       | Replaced directly                                                |
| A file with the same content as the repo | Replaced without a backup, nothing would be lost                 |
| A directory                              | Moved to `<dir>.backup`; with `--no-backup` an error is thrown   |

An older backup is never overwritten: when `<file>.backup` exists, the new one is
`<file>.backup.<timestamp>`. Backups are made with `rename`, so binary files,
modes and symlinks survive exactly.

Options: `backup` (default: on unless `--no-backup`), `dryRun`, `backupSuffix`,
`exclude(relativePath, entry)`. The function returns a summary
(`created`, `unchanged`, `backedUp`, `overwritten`).

## Writing an idempotent setup script

A setup script is a `*setup.ts` file that `bootstrap.ts` runs with bun. It must
be safe to run any number of times. Rules of thumb:

1. **Check, then act.** Use `ensureInstalled('tool', install)`, `aptInstall` (only
   installs what is missing), `gitCloneOrUpdate`, `asdfInstallTool`.
2. **Never append blindly.** Use `appendUniqueLine`, `appendToShellRc` and
   `appendRootLine` instead of `>>` or `tee -a`.
3. **Go through the helpers** (`exec`, `bash`, `download`, ...) for everything that
   changes the machine, so `--dry-run` works. In `bash()` scripts write
   `${SUDO}` instead of `sudo`: it is empty for root (containers, CI).
4. **Work in a temp directory** (`withTempDir`), never in the current directory.
5. **Throw on failure** (the helpers do); `bootstrap.ts` stops or, with
   `--keep-going`, reports at the end.

```ts
import { appendToShellRc, cobraCompletion, download, ensureInstalled, exec, getArch, logger, withTempDir } from '../lib/utils'
import { join } from 'node:path'

logger.info('Setting up mytool...')

await ensureInstalled('mytool', async () => {
  await withTempDir(async (dir) => {
    const file = join(dir, 'mytool')
    await download(`https://example.com/mytool-linux-${getArch()}`, file)
    await exec(['sudo', 'install', '-m', '0755', file, '/usr/local/bin/mytool'])
  })
})

await appendToShellRc(cobraCompletion('mytool'))
```

File name rules: `setup.ts` runs first in its directory, then `*.setup.ts`
alphabetically. A file starting with `!` is never run (use it for examples).
Directories listed in `SETUP_PRIORITY` in `bootstrap.ts` (`packages`,
`install_deb`, `brew`) run first, the others follow alphabetically. Do not name
anything in `lib/` or `tests/` `*setup.ts`.

## Tests

```bash
bun test
```

The tests use throwaway directories and never touch your real `$HOME`.
