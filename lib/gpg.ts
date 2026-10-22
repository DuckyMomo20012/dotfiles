import type { MergeSummary } from './files'
import { chmod, mkdir, rename } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { config } from './config'
import { CommandError } from './errors'
import { mergeDir } from './files'
import { logger } from './logger'
import { commandExists, exec, succeeds, withTempDir } from './shell'

function requireGpg() {
  if (!commandExists('gpg'))
    throw new Error('gpg is not installed. Install it first (sudo apt-get install gnupg).')
}

/** Run gpg, turning a failure into a message that names the operation. */
async function runGpg(args: string[], what: string, input?: string) {
  requireGpg()
  try {
    await exec(['gpg', '--batch', '--yes', ...args], { input })
  }
  catch (err) {
    if (err instanceof CommandError)
      throw new CommandError(err.command, err.exitCode, `Failed to ${what} (gpg exit code ${err.exitCode})`)
    throw err
  }
}

/** Create the parent directory of `file` when it does not exist yet. */
async function ensureParent(file: string) {
  await mkdir(dirname(file), { recursive: true })
}

export async function gpgDecrypt(
  filename: string,
  dest: string,
  passphrase?: string,
) {
  logger.info(`Decrypting ${filename} to ${dest}...`)

  if (config.dryRun) {
    logger.dryRun(`gpg --decrypt ${filename} > ${dest}`)
    return
  }

  await ensureParent(dest)
  // NOTE: Write next to the destination first, so an interrupted or failed run
  // never leaves a truncated file behind.
  const partial = `${dest}.partial`

  // NOTE: If no passphrase is provided, gpg falls back to its own prompt
  // (pinentry), which is what you want for an interactive run. A passphrase is
  // handed over on stdin (`--passphrase-fd 0`) instead of the command line, so
  // it does not show up in `ps` output.
  if (passphrase === undefined) {
    await runGpg(['--output', partial, '--decrypt', filename], `decrypt ${filename}`)
  }
  else {
    await runGpg(
      ['--pinentry-mode', 'loopback', '--passphrase-fd', '0', '--output', partial, '--decrypt', filename],
      `decrypt ${filename}`,
      `${passphrase}\n`,
    )
  }

  await chmod(partial, 0o600)
  await rename(partial, dest)
  logger.info(`Decrypted ${filename} to ${dest}`)
}

export async function gpgEncrypt(
  email: string,
  filename: string,
  dest: string,
) {
  logger.info(`Encrypting ${dest} to ${filename} for ${email}...`)

  if (config.dryRun) {
    logger.dryRun(`gpg --encrypt --recipient ${email} ${dest} > ${filename}`)
    return
  }

  await ensureParent(filename)
  await runGpg(['--trust-model', 'always', '--recipient', email, '--output', filename, '--encrypt', dest], `encrypt ${dest} for ${email}`)
  logger.info(`Encrypted ${dest} to ${filename} for ${email}`)
}

export async function gpgExport(
  email: string,
  filename: string,
) {
  logger.info(`Exporting GPG key for ${email} to ${filename}...`)

  if (config.dryRun) {
    logger.dryRun(`gpg --export-secret-keys ${email} > ${filename}`)
    return
  }

  await ensureParent(filename)
  await runGpg(['--export-options', 'backup', '--export-secret-keys', '--output', filename, email], `export the GPG key for ${email}`)
  // NOTE: This file contains your secret key, keep it private.
  await chmod(filename, 0o600)
  logger.info(`Exported GPG key for ${email} to ${filename}`)
}

/** `true` when a secret key for `email` is already in the keyring. */
export async function gpgHasSecretKey(email: string): Promise<boolean> {
  requireGpg()
  return succeeds(['gpg', '--batch', '--list-secret-keys', email])
}

export async function gpgImport(
  email: string,
  filename: string,
  options: { /** Import even if the key is already present. */ force?: boolean } = {},
) {
  if (!options.force && !config.force && await gpgHasSecretKey(email)) {
    logger.info(`GPG secret key for ${email} is already in the keyring, skipping import (use --force to import anyway).`)
    return
  }

  logger.info(`Importing GPG key for ${email} from ${filename}...`)

  if (config.dryRun) {
    logger.dryRun(`gpg --import ${filename}`)
    return
  }

  await runGpg(['--import-options', 'restore', '--import', filename], `import the GPG key for ${email} from ${filename}`)
  logger.info(`Imported GPG key for ${email} from ${filename}`)
}

/**
 * Decrypt a `*.tar.gz.gpg` archive and unpack it into `destDir`.
 *
 * The plain tarball only ever exists in a private temp directory and is always
 * removed. Files that already exist in `destDir` are left alone when identical
 * and backed up (or replaced with `--no-backup`) when they differ.
 */
export async function gpgDecryptArchive(file: string, destDir: string, passphrase?: string): Promise<MergeSummary> {
  if (config.dryRun) {
    await gpgDecrypt(file, join(destDir, '<archive>'), passphrase)
    return { copied: 0, unchanged: 0, backedUp: 0 }
  }

  return withTempDir(async (tmp) => {
    const tarFile = join(tmp, 'archive.tar.gz')
    await gpgDecrypt(file, tarFile, passphrase)

    const extracted = join(tmp, 'extracted')
    await mkdir(extracted)

    logger.info(`Extracting ${file} to ${destDir}...`)
    await exec(['tar', '--no-same-owner', '-xf', tarFile, '-C', extracted])

    const summary = await mergeDir(extracted, destDir)
    logger.info(`Private files: ${summary.copied} written, ${summary.unchanged} already up to date, ${summary.backedUp} backed up`)
    return summary
  }, 'dotfiles-private-')
}
