# lib

The helper library behind `bootstrap.ts` and every `*setup.ts` file. It gives
setup scripts safe, repeatable building blocks: run commands, install packages,
edit config files, link dotfiles, handle GPG, and honor `--dry-run` and
`--no-backup` everywhere.

Import everything from one place:

```ts
import { appendToShellRc, aptInstall, logger, symlinkDotfileDir } from '../lib/utils'
```

`utils.ts` only re-exports the modules below, so existing imports keep working.
Importing it also (1) makes the script understand the global flags and (2)
prints errors as one readable line.

- [Concepts](#concepts)
- [Global switches](#global-switches)
- [API reference](#api-reference)
  - [constants.ts](#constantsts)
  - [config.ts](#configts)
  - [logger.ts](#loggerts)
  - [shell.ts](#shellts)
  - [files.ts](#filests)
  - [shellrc.ts](#shellrcts)
  - [apt.ts](#aptts)
  - [root.ts](#rootts)
  - [git.ts](#gitts)
  - [asdf.ts](#asdfts)
  - [gpg.ts](#gpgts)
  - [runner.ts](#runnerts)
  - [cli.ts](#clits)
  - [errors.ts](#errorsts)
- [Writing an idempotent setup script](#writing-an-idempotent-setup-script)
- [Testing](#testing)
- [Compatibility](#compatibility)

## Concepts

**Idempotent.** Every helper first looks at the current state and only acts when
something is missing or different. Calling it twice has the same effect as once.

**Dry run.** Every helper that changes the machine goes through one of a few
low-level functions (`exec`, `download`, file writers) that check
`config.dryRun`. A script written with the helpers gets `--dry-run` for free;
a script that calls `Bun.spawn` or `fs.writeFile` by itself does not.

**No hidden state.** Paths are computed when called (`getHome()` reads
`$HOME` each time), so tests can point everything at a temp directory.

## Global switches

| Flag          | Environment variable | `config` property          | Effect                                                        |
| ------------- | -------------------- | -------------------------- | ------------------------------------------------------------- |
| `--dry-run`   | `DOTFILES_DRY_RUN`   | `config.dryRun`            | Log every change, perform none                                |
| `--no-backup` | `DOTFILES_NO_BACKUP` | `config.backup` (inverted) | Replace existing files directly instead of backing them up    |
| `--force`     | `DOTFILES_FORCE`     | `config.force`             | Reinstall tools that exist, refresh apt lists, re-import keys |
| `--verbose`   | `DOTFILES_VERBOSE`   | `config.verbose`           | Print debug output, including every command that is run       |

Other variables:

| Variable                                         | Effect                                                         |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `DOTFILES_APT_INTERACTIVE`                       | Set to `1` to let apt ask questions (default: non-interactive) |
| `DOTFILES_NO_ERROR_HANDLER`                      | Set to `1` to keep the default uncaught error output (tests)   |
| `GITHUB_TOKEN`                                   | Used for GitHub API calls (avoids the 60 requests/hour limit)  |
| `NO_COLOR`, `FORCE_COLOR`                        | Turn colors off / on                                           |
| `GPG_EMAIL`, `GPG_PASSPHRASE`, `GPG_SECRET_FILE` | Defaults for the GPG scripts                                   |

`bootstrap.ts` turns its flags into these variables, so every setup file it
starts follows them. A single script understands them too:

```bash
bun devops/helm.setup.ts --dry-run --verbose
DOTFILES_DRY_RUN=1 bun devops/helm.setup.ts          # same thing
```

Values `0`, `false`, `no`, `off` and the empty string mean "off".

## API reference

Notation: `→` is the return type. All functions that touch the system are
`async`.

### constants.ts

| Export         | Value                                                             |
| -------------- | ----------------------------------------------------------------- |
| `ROOT_DIR`     | Absolute path of the repository                                   |
| `DOTFILES_DIR` | `<repo>/dotfiles`                                                 |
| `PRIVATE_DIR`  | `<repo>/private`                                                  |
| `getHome()`    | `$HOME`, or the OS home directory when unset. Read on every call. |
| `bunBinPath`   | `~/.bun/bin/bun` if it exists, else the bun that runs the script  |
| `asdfBinPath`  | `~/.asdf/bin/asdf`                                                |
| `brewBinPath`  | `/home/linuxbrew/.linuxbrew/bin/brew`                             |
| `helmBinPath`  | `/usr/local/bin/helm`                                             |

```ts
import { join } from 'node:path'
import { getHome } from '../lib/utils'

const npmrc = join(getHome(), '.npmrc')
```

### config.ts

```ts
config.dryRun // boolean
config.backup // true unless --no-backup
config.force // boolean
config.verbose // boolean

setConfig({ dryRun: true, backup: false }) // also sets the DOTFILES_* env vars
configFromArgv(['--dry-run', '--email', 'x']) // → { dryRun: true } (ignores unknown flags)
isTruthy('off') // → false
```

`setConfig` writes environment variables, so child processes started afterwards
inherit the values.

### logger.ts

```ts
logger.info('Installing foo...') // cyan, stdout
logger.success('Linked a to b') // green, stdout
logger.warn('foo is old') // yellow, stderr
logger.error('foo failed') // red bold, stderr
logger.debug('only with --verbose') // gray, stdout
logger.dryRun('append to ~/.zshrc') // magenta, prefixed "[dry-run] "
```

Colors are off when the output is not a terminal or `NO_COLOR` is set.

### shell.ts

#### Running commands

```ts
exec(cmd: string[], options?: ExecOptions) → { exitCode, stdout }
bash(script: string, options?: ExecOptions) → { exitCode, stdout }
capture(cmd: string[], options?) → string | null     // trimmed stdout, null on failure
succeeds(cmd: string[], options?) → boolean          // exit code 0?
```

`ExecOptions`:

| Option         | Meaning                                                                        |
| -------------- | ------------------------------------------------------------------------------ |
| `cwd`          | Working directory                                                              |
| `env`          | Extra environment variables (`undefined` removes one)                          |
| `readOnly`     | Run even in dry run (for probes that do not change anything)                   |
| `allowFailure` | Do not throw on a non-zero exit code                                           |
| `capture`      | Return stdout instead of printing it                                           |
| `quiet`        | Silence stderr (and stdout when not captured)                                  |
| `input`        | Text or bytes written to stdin. Without it, stdin is inherited (prompts work). |

`exec` does not use a shell, so there is no quoting trouble:

```ts
await exec(['sudo', 'install', '-m', '0755', file, '/usr/local/bin/tool'])
const kernel = await capture(['uname', '-r'])
if (await succeeds(['dpkg', '-s', 'curl'])) { /* ... */ }
```

When you are root a leading `sudo` is dropped. Output goes straight to the
terminal, so progress bars and password prompts work. A non-zero exit throws a
`CommandError` (unless `allowFailure`); a missing binary throws one with exit
code `127`.

`bash` runs `bash -o pipefail -c <script>`; use it only for real pipelines:

```ts
import { bash, SUDO } from '../lib/utils'

await bash(`curl -fsSL https://aka.ms/InstallAzureCLIDeb | ${SUDO} bash`)
await bash('make install', { cwd: buildDir, env: { PREFIX: '/opt/tool' } })
```

`SUDO` is `''` for root and `'sudo'` otherwise. Never put untrusted text into a
`bash` script string.

#### Downloads

```ts
download(url, dest, { retries?: 3, headers?, mode? })     // atomic, retried
fetchText(url, retries = 3) → string                       // trimmed body
githubLatestAsset('owner/repo', name => name.endsWith('linux_amd64.tar.gz'))
  → { name, url, tag }
sha256File(path) → string
verifySha256(file, expectedHex)                            // throws "Checksum mismatch ..."
```

`download` writes `<dest>.partial` and renames it on success, creating parent
directories. `githubLatestAsset` throws a clear message on rate limits and
when no asset matches; set `GITHUB_TOKEN` to avoid limits. In dry run neither
makes a network call.

```ts
const asset = await githubLatestAsset('helmfile/helmfile', n => n.endsWith(`linux_${getArch()}.tar.gz`))
await download(asset.url, join(dir, 'helmfile.tar.gz'))
```

#### Installing binaries

```ts
ensureInstalled('tool', async () => { /* install */ }, { paths?: string[], label?: string }) → boolean
isInstalled('tool', paths?) → boolean
installBinary(src, dest, { mode = '0755', sudo = false })
installBinaryFromTarGz(archive, 'binaryName', dest, { mode?, sudo? })
```

`ensureInstalled` skips the installer when `tool` is on `PATH` or one of `paths`
exists, unless `--force`. It returns `true` when the installer ran. `paths` is
for tools installed outside `PATH` (`~/.local/bin/uv`).

`installBinaryFromTarGz` extracts to a temp directory, finds the file with that
name anywhere in the archive and installs only that file, leaving LICENSE and
README files behind.

#### Small helpers

```ts
withTempDir(async (dir) => { /* ... */ }, prefix?)   // private dir, always removed
retry(async (attempt) => ..., { attempts: 3, delayMs: 1000, label })
sleep(ms)
getArch()                         // 'amd64' | 'arm64', throws otherwise
readOsRelease()                   // { ID: 'ubuntu', UBUNTU_CODENAME: 'noble', ... }
getCodename()                     // Ubuntu codename, also on derivatives
isRoot(), commandExists('git')
```

#### sudo keep-alive

```ts
const stop = await startSudo() // ask once, refresh every 4 minutes
// ...
await stop() // optional: drops the credentials (also done on exit/SIGINT/SIGTERM)
```

A no-op for root, passwordless sudo, no `sudo` binary and dry run. Throws when
the password is wrong.

### files.ts

#### Lines in files

```ts
appendUniqueLine(line, file, { dryRun? }) → boolean   // true when the file changed
```

Appends `line` unless an equal line (ignoring trailing spaces) exists. Creates
the file and parent directories, never rewrites or reorders existing content,
fixes a missing final newline, follows symlinks.

```ts
await appendUniqueLine('export EDITOR=nvim', join(getHome(), '.profile')) // true
await appendUniqueLine('export EDITOR=nvim', join(getHome(), '.profile')) // false
```

#### Symlinks

```ts
linkFile(source, target, { backup?, dryRun?, backupSuffix? }) → LinkResult
symlinkDotfileDir(sourceDir, targetDir, ignorePath?, { backup?, dryRun?, backupSuffix?, exclude? }) → SymlinkDirSummary
```

`linkFile` makes `target` a symlink to `source`:

| What is at `target`                            | Result (`status`)                                          |
| ---------------------------------------------- | ---------------------------------------------------------- |
| Nothing                                        | `created`                                                  |
| Already the right link, or the same file       | `unchanged`, nothing touched                               |
| A regular file with identical content          | `overwritten`, replaced without a backup (nothing is lost) |
| A different file, link or dangling link        | `backed-up`: renamed to `<target>.backup`, then linked     |
| The same, with `backup: false` / `--no-backup` | `overwritten`: removed, then linked                        |
| A directory, with backups                      | `backed-up`                                                |
| A directory, with `backup: false`              | throws `Refusing to overwrite directory ...`               |

`LinkResult` is `{ source, target, status, backupPath? }`. The backup name is
`<target>.backup`; if taken, `<target>.backup.<YYYYMMDDHHMMSS>`.

```ts
const result = await linkFile('/repo/.zshrc', `${getHome()}/.zshrc`)
if (result.status === 'backed-up')
  logger.warn(`Your old file is ${result.backupPath}`)
```

`symlinkDotfileDir` links every file of `sourceDir`, recursively. The target
path is `targetDir` plus the file's path relative to `ignorePath` (default:
`sourceDir`). It skips: names starting with `!`, `*.md`, names that contain
`setup`, `*.backup` files, and files outside `ignorePath`. `exclude(relativePath,
dirent)` adds your own rule. It returns
`{ created, unchanged, backedUp, overwritten, results }`.

```ts
// ~/dotfiles/dotfiles/.config/foo/x  ->  ~/.config/foo/x
await symlinkDotfileDir(DOTFILES_DIR, getHome(), DOTFILES_DIR)

// Do not link fonts on a server
await symlinkDotfileDir(DOTFILES_DIR, getHome(), undefined, { exclude: rel => rel.startsWith('.fonts') })

// Private files that live in private/dotfiles, source dir is the whole private dir
await symlinkDotfileDir(PRIVATE_DIR, getHome(), join(PRIVATE_DIR, 'dotfiles')) // only files under ignorePath are linked
```

#### Copying trees and other helpers

```ts
mergeDir(sourceDir, destDir, { backup?, dryRun?, backupSuffix? }) → { copied, unchanged, backedUp }
backupFile(path, suffix = '.backup') → string          // renames, returns the new path
filesEqual(a, b) → boolean
pathExists(path) → boolean                             // follows symlinks
lexists(path) → boolean                                // true for dangling symlinks too
readLinkTarget(path) → string | null
isLinkableDotfile(name) → boolean                      // the default filter of symlinkDotfileDir
```

`mergeDir` copies new files, skips identical ones and backs up different ones.
It is used to unpack decrypted private files.

### shellrc.ts

```ts
appendToShellRc(lines, { shells?: ['bash', 'zsh'], files?: { bash?, zsh? } }) → string[]   // files that changed
cobraCompletion('kubectl', extra?) → (shell) => string
```

`lines` is a string, an array, or a function of the shell (`'bash'` or `'zsh'`).
A shell is only configured when its rc file (`~/.bashrc`, `~/.zshrc`) exists.
`files` writes to another file (relative to `$HOME`) while still checking the rc
file. Lines are added once.

```ts
await appendToShellRc(`export PATH=$HOME/.npm-global/bin:$PATH`)
await appendToShellRc(shell => `eval "$(starship init ${shell})"`)
await appendToShellRc('export GTK_IM_MODULE=fcitx', { files: { bash: '.bash_profile', zsh: '.zprofile' } })
await appendToShellRc(cobraCompletion('kubectl'))
// → if command -v kubectl >/dev/null 2>&1; then source <(kubectl completion zsh); fi
await appendToShellRc(cobraCompletion('argocd', ' compdef _argocd argocd;'))
```

### apt.ts

```ts
isPackageInstalled('curl') → boolean
aptUpdate({ maxAgeMinutes = 60 })
aptInstall(['curl', 'git']) → string[]           // the packages that were installed
aptRemove([...]) → string[]                      // only installed ones are removed
aptInstallDebFiles(['/path/a.deb']) → string[]   // skips equal versions
ensureAptRepo({ keyUrl, keyPath, dearmor?, listPath, listLine }) → boolean
prettyAptInstall('sudo apt-get install -y git')  // old API, always runs
```

- `aptUpdate` skips the update when `/var/lib/apt/periodic/update-success-stamp`
  is younger than `maxAgeMinutes` (use `0` after adding a repository, or pass
  `--force`).
- `aptInstall` checks each package with `dpkg-query`; with everything installed
  there is no sudo, no network and no apt lock.
- All apt commands run `apt-get -o DPkg::Lock::Timeout=300` with
  `DEBIAN_FRONTEND=noninteractive` (unless `DOTFILES_APT_INTERACTIVE=1`).
- `ensureAptRepo` downloads the key (and dearmors it with `gpg` when
  `dearmor: true`), then writes key and list through `writeRootFile`. It
  returns `true` when either changed.

```ts
await aptUpdate()
await aptInstall(['git', 'curl'])
```

### root.ts

```ts
writeRootFile(path, content, { mode = '0644' }) → boolean   // true when written
appendRootLine(path, line) → boolean                        // true when added
```

Both compare with the current content first. Writing uses a private temp file
and `sudo install -D`, so there is no `sudo tee` and no half written file.

```ts
await appendRootLine('/etc/modprobe.d/alsa-base.conf', 'options snd_hda_intel power_save=0')
```

### git.ts

```ts
gitCloneOrUpdate(url, dest, { depth = 1, update = true }) → boolean   // true on a fresh clone
```

Clones into `<dest>.partial` and renames, so a failed clone leaves nothing. If
`dest` is already a git repository it runs `git pull --ff-only` (a failure
only warns). If `dest` is something else, it is replaced by a clone.

### asdf.ts

```ts
asdfInstallTool({ plugin, version, url?, global = true })
asdfEnv() → { PATH }          // asdf bin and shims first, for plugin scripts
```

Steps (each skipped when done): `plugin add`, `install`, `set -u`, `reshim`.

```ts
await asdfInstallTool({ plugin: 'golang', version: '1.23.4', url: 'https://github.com/asdf-community/asdf-golang.git' })
```

### gpg.ts

```ts
gpgEncrypt(email, outFile, inFile)
gpgDecrypt(file, outFile, passphrase?)
gpgDecryptArchive(file, destDir, passphrase?) → { copied, unchanged, backedUp }
gpgExport(email, outFile)
gpgImport(email, file, { force? })
gpgHasSecretKey(email) → boolean
```

- Errors name the operation: `Failed to decrypt private/x.gpg (gpg exit code 2)`.
- `gpgDecrypt` writes `<outFile>.partial` with mode `0600`, then renames.
  A passphrase goes to gpg on stdin; without one gpg asks.
- `gpgDecryptArchive` decrypts to a private temp directory, unpacks the tarball
  there and merges it into `destDir` with `mergeDir` (identical files skipped,
  changed files backed up). The plain tarball never touches `destDir`.
- `gpgExport` sets mode `0600` on the output.
- `gpgImport` is skipped when a secret key for `email` exists (`--force` imports
  anyway).

```ts
await gpgDecryptArchive(join(PRIVATE_DIR, 'encrypted.tar.gz.gpg'), PRIVATE_DIR, process.env.GPG_PASSPHRASE)
```

### runner.ts

```ts
runSetupFilesInDir(dir, options) → { ran, skipped, failed }
findSetupFiles(dir) → string[]       // paths relative to dir
isMainSetupFile(file) → boolean      // basename is exactly setup.ts
```

Options:

| Option             | Meaning                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| `runMainSetupOnly` | In a directory that has `setup.ts`, skip the other files                  |
| `ignores`          | Skip paths (relative to the repository) that contain one of these strings |
| `only`             | Run only paths that contain one of these strings                          |
| `priority`         | Directories (relative to `dir`) that run first, in order                  |
| `keepGoing`        | Continue after a failure; the failures are in the result                  |
| `env`, `cwd`       | Extra environment / working directory for the processes                   |

Without `keepGoing` the first failure throws `SetupFailedError`. Order: priority
directories, then alphabetical; `setup.ts` before `*.setup.ts`. See
[how it works](../docs/how-it-works.md#finding-setup-files).

```ts
const result = await runSetupFilesInDir(ROOT_DIR, {
  ignores: ['asdf', 'private'],
  priority: ['packages', 'brew'],
  keepGoing: true,
})
if (result.failed.length > 0)
  process.exit(1)
```

### cli.ts

For scripts that parse their own arguments with `node:util` `parseArgs`:

```ts
import { parseArgs } from 'node:util'
import { applyCommonOptions, commonHelp, commonOptions } from '../lib/utils'

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: { name: { type: 'string', short: 'n' }, ...commonOptions }, // careful: -n is taken by --dry-run
  strict: true,
})
applyCommonOptions(values) // dry-run, no-backup, force, verbose → config
console.log(`Usage: ...\n${commonHelp}`)
```

`commonOptions` defines `--dry-run` (`-n`), `--no-backup`, `--force`, `--verbose` (`-v`).

### errors.ts

- `CommandError` (`command`, `exitCode`): a command failed. Its exit code becomes
  the process exit code when it is not handled.
- `SetupFailedError` (`failures`): setup files failed.
- `installErrorHandlers()`: called by `lib/utils`. Prints `Error: <message>` and
  exits non-zero; with `--verbose` it also prints the stack.

## Writing an idempotent setup script

A setup script is a `*setup.ts` file that `bootstrap.ts` runs with bun. It must
be safe to run any number of times. Checklist:

1. **Check, then act.** `ensureInstalled`, `aptInstall`, `gitCloneOrUpdate`,
   `asdfInstallTool`.
2. **Never append blindly.** `appendUniqueLine`, `appendToShellRc`,
   `appendRootLine` instead of `>>` and `tee -a`.
3. **Go through the helpers** for everything that changes the machine, so
   `--dry-run` works. In `bash()` scripts write `${SUDO}` instead of `sudo`.
4. **Work in a temp directory** (`withTempDir`), never in the current directory.
5. **Throw on failure.** The helpers do. Do not `process.exit(0)` on errors.
6. **Log what you do** with `logger.info`, and say when you skip something.
7. **Test it:** `--dry-run` shows the plan; run it for real; run it again and
   confirm that nothing changes.

A complete example, `devops/mytool.setup.ts`:

```ts
import { join } from 'node:path'
import { appendToShellRc, cobraCompletion, download, ensureInstalled, exec, fetchText, getArch, logger, verifySha256, withTempDir } from '../lib/utils'

logger.info('Setting up mytool...')

await ensureInstalled('mytool', async () => {
  const base = 'https://example.com/releases/latest'
  const name = `mytool-linux-${getArch()}`

  await withTempDir(async (dir) => {
    const file = join(dir, name)
    await download(`${base}/${name}`, file)
    await verifySha256(file, (await fetchText(`${base}/${name}.sha256`)).split(/\s+/)[0] ?? '')
    await exec(['sudo', 'install', '-m', '0755', file, '/usr/local/bin/mytool'])
  })
})

await appendToShellRc(cobraCompletion('mytool'))
```

Session:

```text
$ bun devops/mytool.setup.ts --dry-run
Setting up mytool...
[dry-run] download https://example.com/releases/latest/mytool-linux-amd64 -> /tmp/dotfiles-aB3dE/mytool-linux-amd64
[dry-run] $ install -m 0755 /tmp/dotfiles-aB3dE/mytool-linux-amd64 /usr/local/bin/mytool
...
$ bun devops/mytool.setup.ts
...
$ bun devops/mytool.setup.ts
Setting up mytool...
mytool is already installed, skipping (use --force to reinstall).
```

Naming and ordering:

- `setup.ts` runs first in its directory, then `*.setup.ts` alphabetically.
- A file that starts with `!` is never run (use it for examples).
- Directories in `SETUP_PRIORITY` (`bootstrap.ts`) run first.
- Do not name a helper `*setup.ts` outside `lib/` and `tests/`.

## Testing

```bash
bun test                       # all tests
bun test tests/files.test.ts   # one file
bun test -t "idempotent"       # tests with this name
```

The tests (`tests/`) use throwaway directories (`makeSandbox()` in
`tests/helpers.ts`) and never touch your real `$HOME`. They cover:

| File              | What                                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `files.test.ts`   | `linkFile`, `symlinkDotfileDir`, `appendUniqueLine`, `backupFile`, `mergeDir`: creating, repeating, backing up, `--no-backup`, dry run, binary files, symlinked parents |
| `shellrc.test.ts` | rc files, once-only lines, other target files, completion lines                                                                                                         |
| `runner.test.ts`  | discovery, ordering, `only`/`ignores`, failures, `keepGoing`                                                                                                            |
| `config.test.ts`  | switches and argument parsing                                                                                                                                           |

A test for your own helper:

```ts
import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, expect, test } from 'bun:test'
import { appendUniqueLine } from '../lib/utils'
import { makeSandbox } from './helpers'

let sb: Awaited<ReturnType<typeof makeSandbox>>
beforeEach(async () => { sb = await makeSandbox() })
afterEach(async () => { await sb.cleanup() })

test('adds a line once', async () => {
  const file = sb.path('rc')
  await appendUniqueLine('a', file)
  await appendUniqueLine('a', file)
  expect(await readFile(file, 'utf8')).toBe('a\n')
})
```

## Compatibility

Everything the old `lib/utils.ts` exported still exists with the same
arguments: `logger`, `appendUniqueLine`, `startSudo`, `symlinkDotfileDir`,
`prettyAptInstall`, `isMainSetupFile`, `runSetupFilesInDir`, `gpgDecrypt`,
`gpgEncrypt`, `gpgExport`, `gpgImport`, plus the constants. Differences you may
notice:

- Functions throw instead of calling `process.exit(1)`; the error handler prints
  the message and exits with a non-zero code, as before.
- `symlinkDotfileDir` and `runSetupFilesInDir` return a summary instead of
  `undefined`.
- `appendUniqueLine` does not rewrite the file; it appends.
- `warn` and `error` log to stderr.
