import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { config } from './config'
import { CommandError } from './errors'
import { logger } from './logger'
import { writeRootFile } from './root'
import { capture, download, exec, withTempDir } from './shell'

const APT_STAMP = '/var/lib/apt/periodic/update-success-stamp'

/** Environment that keeps `apt-get` from asking questions. Set `DOTFILES_APT_INTERACTIVE=1` to opt out. */
function aptEnv(): string[] {
  return process.env.DOTFILES_APT_INTERACTIVE ? [] : ['env', 'DEBIAN_FRONTEND=noninteractive']
}

function aptGetCommand(args: string[]): string[] {
  // NOTE: Wait for the dpkg lock instead of failing when e.g. unattended-upgrades is running.
  return ['sudo', ...aptEnv(), 'apt-get', '-o', 'DPkg::Lock::Timeout=300', ...args]
}

/** `true` when the Debian package is fully installed. */
export async function isPackageInstalled(pkg: string): Promise<boolean> {
  // NOTE: `${Status}` is dpkg-query's own format syntax, not a JavaScript template.
  // eslint-disable-next-line no-template-curly-in-string
  const status = await capture(['dpkg-query', '-W', '-f=${Status}', pkg])
  return status !== null && status.includes('install ok installed')
}

/**
 * `apt-get update`, unless the package lists were refreshed less than
 * `maxAgeMinutes` ago. Pass `0` after adding a new repository.
 */
export async function aptUpdate({ maxAgeMinutes = 60 }: { maxAgeMinutes?: number } = {}): Promise<void> {
  if (maxAgeMinutes > 0 && !config.force) {
    try {
      const ageMs = Date.now() - (await stat(APT_STAMP)).mtimeMs
      if (ageMs < maxAgeMinutes * 60_000) {
        logger.debug(`apt lists are fresh (${Math.round(ageMs / 60_000)} min old), skipping update`)
        return
      }
    }
    catch {
      // No stamp: update.
    }
  }

  await exec(aptGetCommand(['update']))
}

/**
 * Install the packages that are not installed yet. Returns the names that were
 * (or, in dry-run, would be) installed.
 */
export async function aptInstall(packages: string[]): Promise<string[]> {
  const missing: string[] = []
  for (const pkg of packages) {
    if (!(await isPackageInstalled(pkg)))
      missing.push(pkg)
  }

  if (missing.length === 0) {
    logger.info(`Already installed: ${packages.join(', ')}`)
    return []
  }

  logger.info(`Installing: ${missing.join(', ')}`)
  await exec(aptGetCommand(['install', '-y', ...missing]))
  return missing
}

/**
 * Install local `.deb` files, skipping those whose exact package version is
 * already installed. Returns the files that were (or would be) installed.
 */
export async function aptInstallDebFiles(files: string[]): Promise<string[]> {
  const pending: string[] = []

  for (const file of files) {
    const meta = await capture(['dpkg-deb', '-f', file, 'Package', 'Version'])
    const name = /^Package:\s*(\S+)/m.exec(meta ?? '')?.[1]
    const version = /^Version:\s*(\S+)/m.exec(meta ?? '')?.[1]
    // NOTE: `${Version}` is dpkg-query's own format syntax, not a JavaScript template.
    // eslint-disable-next-line no-template-curly-in-string
    const installed = name ? await capture(['dpkg-query', '-W', '-f=${Version}', name]) : null

    if (name && version && installed === version) {
      logger.info(`${name} ${version} is already installed (${file}).`)
      continue
    }
    pending.push(file)
  }

  if (pending.length === 0)
    return []

  logger.info(`Installing: ${pending.join(', ')}`)
  await exec(aptGetCommand(['install', '-y', ...pending]))
  return pending
}

/** Remove only the packages that are installed (a plain `apt-get remove` fails on unknown names). */
export async function aptRemove(packages: string[]): Promise<string[]> {
  const installed: string[] = []
  for (const pkg of packages) {
    if (await isPackageInstalled(pkg))
      installed.push(pkg)
  }

  if (installed.length === 0)
    return []

  logger.info(`Removing: ${installed.join(', ')}`)
  await exec(aptGetCommand(['remove', '-y', ...installed]))
  return installed
}

/**
 * Run an arbitrary apt command given as a string, e.g. `sudo apt-get install -y git`.
 * Kept for backwards compatibility; prefer {@link aptInstall} / {@link aptUpdate},
 * which skip work that is already done.
 */
export async function prettyAptInstall(args: string): Promise<void> {
  const parts = args.split(/\s+/).filter(Boolean)
  const aptIndex = parts.indexOf('apt-get')

  let cmd = parts
  if (aptIndex !== -1 && parts[0] === 'sudo') {
    cmd = ['sudo', ...aptEnv(), 'apt-get', '-o', 'DPkg::Lock::Timeout=300', ...parts.slice(aptIndex + 1)]
  }

  try {
    await exec(cmd)
  }
  catch (err) {
    if (err instanceof CommandError)
      throw new CommandError(err.command, err.exitCode, `Failed to run "${args}". Exit code: ${err.exitCode}`)
    throw err
  }
}

export interface AptRepoOptions {
  /** URL of the signing key (ASCII armored or binary). */
  keyUrl: string
  /** Where to store the key, e.g. `/etc/apt/keyrings/docker.asc`. */
  keyPath: string
  /** Convert the key with `gpg --dearmor` (needed for `.gpg` keyrings). */
  dearmor?: boolean
  /** Path of the `.list` file, e.g. `/etc/apt/sources.list.d/docker.list`. */
  listPath: string
  /** Content of the `.list` file (a trailing newline is added). */
  listLine: string
}

/**
 * Add an apt repository: install its key and `.list` file, rewriting them only
 * when they differ. Returns `true` when anything changed (run `aptUpdate({ maxAgeMinutes: 0 })` then).
 */
export async function ensureAptRepo(options: AptRepoOptions): Promise<boolean> {
  if (config.dryRun) {
    logger.dryRun(`ensure apt repo: ${options.listPath}`)
    return true
  }

  const key = await withTempDir(async (dir) => {
    const downloaded = join(dir, 'key')
    await download(options.keyUrl, downloaded)
    if (!options.dearmor)
      return readFile(downloaded)

    const dearmored = join(dir, 'key.gpg')
    await exec(['gpg', '--batch', '--yes', '--dearmor', '--output', dearmored, downloaded])
    return readFile(dearmored)
  })

  const keyChanged = await writeRootFile(options.keyPath, key)
  const listChanged = await writeRootFile(options.listPath, `${options.listLine}\n`)
  return keyChanged || listChanged
}
