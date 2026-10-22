import { mkdir, rename, rm } from 'node:fs/promises'
import { dirname } from 'node:path'
import { config } from './config'
import { lexists, pathExists } from './files'
import { logger } from './logger'
import { exec, succeeds } from './shell'

export interface CloneOptions {
  depth?: number
  /** Fast-forward an existing clone. Default `true`. */
  update?: boolean
}

/**
 * Make `dest` a clone of `url`:
 * - not there: clone (into a temp dir first, so a failed clone leaves nothing behind)
 * - already a git repo: fast-forward it (a failed update only warns, e.g. when offline)
 * - something else is there: replace it with a fresh clone
 *
 * Returns `true` when a fresh clone was made.
 */
export async function gitCloneOrUpdate(url: string, dest: string, options: CloneOptions = {}): Promise<boolean> {
  const { depth = 1, update = true } = options
  const depthArgs = depth > 0 ? ['--depth', String(depth)] : []

  if (await pathExists(`${dest}/.git`)) {
    if (!update) {
      logger.info(`${dest} already exists, skipping.`)
      return false
    }

    logger.info(`Updating ${dest}...`)
    const ok = await succeeds(['git', '-C', dest, 'pull', '--ff-only', '--quiet'])
    if (!ok)
      logger.warn(`Could not update ${dest} (offline or local changes). Keeping the current version.`)
    return false
  }

  if (config.dryRun) {
    logger.dryRun(`git clone ${url} ${dest}`)
    return true
  }

  await mkdir(dirname(dest), { recursive: true })
  const partial = `${dest}.partial`
  await rm(partial, { recursive: true, force: true })
  await exec(['git', 'clone', ...depthArgs, url, partial])

  if (await lexists(dest)) {
    logger.warn(`${dest} exists but is not a git repository, replacing it.`)
    await rm(dest, { recursive: true, force: true })
  }
  await rename(partial, dest)
  return true
}
