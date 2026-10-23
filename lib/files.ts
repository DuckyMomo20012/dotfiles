import type { Dirent } from 'node:fs'
import { access, appendFile, copyFile, lstat, mkdir, readdir, readFile, readlink, realpath, rename, rm, stat, symlink } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { config } from './config'
import { logger } from './logger'

// ---------------------------------------------------------------------------
// Small fs helpers
// ---------------------------------------------------------------------------

/** `true` when `path` exists. Follows symlinks, so a dangling symlink is `false`. */
export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  }
  catch {
    return false
  }
}

/** `true` when something (even a dangling symlink) is at `path`. */
export async function lexists(path: string): Promise<boolean> {
  try {
    await lstat(path)
    return true
  }
  catch {
    return false
  }
}

async function lstatOrNull(path: string) {
  try {
    return await lstat(path)
  }
  catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT' || (err as NodeJS.ErrnoException).code === 'ENOTDIR')
      return null
    throw err
  }
}

async function realpathOrNull(path: string): Promise<string | null> {
  try {
    return await realpath(path)
  }
  catch {
    return null
  }
}

/** Compare two regular files byte for byte. */
export async function filesEqual(a: string, b: string): Promise<boolean> {
  try {
    const [sa, sb] = await Promise.all([stat(a), stat(b)])
    if (!sa.isFile() || !sb.isFile() || sa.size !== sb.size)
      return false
    const [ba, bb] = await Promise.all([readFile(a), readFile(b)])
    return ba.equals(bb)
  }
  catch {
    return false
  }
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
}

/**
 * Move `target` out of the way and return the new path. The first backup is
 * `<target>.backup`; if that is taken, a timestamp is added so an older backup
 * is never overwritten. Uses `rename`, so binaries, modes and symlinks survive.
 */
export async function backupFile(target: string, suffix = '.backup'): Promise<string> {
  let candidate = `${target}${suffix}`
  if (await lexists(candidate))
    candidate = `${target}${suffix}.${timestamp()}`
  for (let i = 1; await lexists(candidate); i++)
    candidate = `${target}${suffix}.${timestamp()}.${i}`

  await rename(target, candidate)
  return candidate
}

// ---------------------------------------------------------------------------
// Lines in files
// ---------------------------------------------------------------------------

export interface AppendLineOptions {
  /** Defaults to the global `--dry-run`. */
  dryRun?: boolean
}

/**
 * Append `line` to `fileName` unless an identical line is already there.
 * Creates the file (and parent directories) when missing and never rewrites
 * existing content. Returns `true` when the file changed.
 */
export async function appendUniqueLine(line: string, fileName: string, options: AppendLineOptions = {}): Promise<boolean> {
  if (!line || !fileName)
    return false

  let content = ''
  try {
    content = await readFile(fileName, 'utf8')
  }
  catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT')
      throw err
  }

  const wanted = line.trimEnd()
  if (content.split(/\r?\n/).some(existing => existing.trimEnd() === wanted))
    return false

  if (options.dryRun ?? config.dryRun) {
    logger.dryRun(`append to ${fileName}: ${line}`)
    return true
  }

  await mkdir(dirname(fileName), { recursive: true })
  const separator = content === '' || content.endsWith('\n') ? '' : '\n'
  // NOTE: `appendFile` keeps the file mode and follows symlinks.
  await appendFile(fileName, `${separator}${line}\n`)
  return true
}

// ---------------------------------------------------------------------------
// Symlinks
// ---------------------------------------------------------------------------

export interface LinkOptions {
  /**
   * Back up an existing, different file before replacing it. `false` replaces it
   * directly. Defaults to `true` unless `--no-backup` / `DOTFILES_NO_BACKUP` is set.
   */
  backup?: boolean
  /** Defaults to the global `--dry-run`. */
  dryRun?: boolean
  /** Suffix of backup files. Default `.backup`. */
  backupSuffix?: string
}

export type LinkStatus
  /** The link did not exist and was created. */
  = | 'created'
  /** The link was already correct, nothing was touched. */
    | 'unchanged'
  /** Something else was there; it was moved to `backupPath` and the link created. */
    | 'backed-up'
  /** Something else was there; it was removed and the link created. */
    | 'overwritten'

export interface LinkResult {
  source: string
  target: string
  status: LinkStatus
  backupPath?: string
}

/**
 * Make `target` a symlink to `source`, safely and repeatably.
 *
 * - Already correct: nothing happens (so no new backups on every run).
 * - Missing: parent directories are created, then the link.
 * - A different file/symlink is in the way: it is moved to `<target>.backup`
 *   (never overwriting an older backup) or removed with `backup: false`.
 *   A regular file with the same content as `source` is replaced without a
 *   backup, since nothing would be lost.
 * - A directory is in the way: backed up, or an error with `backup: false`
 *   (recursive deletes are never done silently).
 */
export async function linkFile(sourcePath: string, targetPath: string, options: LinkOptions = {}): Promise<LinkResult> {
  const source = resolve(sourcePath)
  const target = resolve(targetPath)
  const backup = options.backup ?? config.backup
  const dryRun = options.dryRun ?? config.dryRun

  const result = (status: LinkStatus, backupPath?: string): LinkResult => ({ source, target, status, backupPath })

  if (!(await lexists(source)))
    throw new Error(`Cannot link missing source file: ${source}`)

  const existing = await lstatOrNull(target)

  if (existing !== null) {
    // Same file already (direct link, link in a parent dir, bind setups...).
    const [realSource, realTarget] = await Promise.all([realpathOrNull(source), realpathOrNull(target)])
    if (realSource !== null && realSource === realTarget)
      return result('unchanged')
  }

  let backupPath: string | undefined
  let status: LinkStatus = 'created'

  if (existing !== null) {
    const identicalFile = existing.isFile() && await filesEqual(source, target)

    if (identicalFile) {
      status = 'overwritten'
    }
    else if (backup) {
      status = 'backed-up'
    }
    else if (existing.isDirectory()) {
      throw new Error(`Refusing to overwrite directory ${target} without a backup. Move or delete it first.`)
    }
    else {
      status = 'overwritten'
    }

    if (dryRun) {
      if (status === 'backed-up')
        logger.dryRun(`back up ${target} to ${target}${options.backupSuffix ?? '.backup'}`)
      else
        logger.dryRun(`replace ${target}`)
    }
    else if (status === 'backed-up') {
      backupPath = await backupFile(target, options.backupSuffix)
      logger.warn(`Backed up existing ${target} to ${backupPath}`)
    }
    else {
      await rm(target, { force: true })
      if (!identicalFile)
        logger.warn(`Overwriting existing ${target} (backup disabled)`)
    }
  }

  if (dryRun) {
    logger.dryRun(`link ${source} -> ${target}`)
    return result(status, backupPath)
  }

  await mkdir(dirname(target), { recursive: true })
  await symlink(source, target)
  return result(status, backupPath)
}

export interface SymlinkDirOptions extends LinkOptions {
  /** Extra exclusion on top of the defaults. Receives the path relative to `ignorePath`. */
  exclude?: (relativePath: string, entry: Dirent) => boolean
}

export interface SymlinkDirSummary {
  created: number
  unchanged: number
  backedUp: number
  overwritten: number
  results: LinkResult[]
}

/**
 * Files that are never linked: those starting with `!` (disabled examples),
 * markdown files, setup scripts and our own `.backup` files.
 */
export function isLinkableDotfile(name: string): boolean {
  // NOTE: `.backup` files are made by this library, they must never be linked back.
  return !name.startsWith('!') && !name.endsWith('.md') && !name.includes('setup') && !/\.backup(?:\.\d+)*$/.test(name)
}

/**
 * Symlink every file in `sourceDir` (recursively) into `targetDir`, keeping the
 * directory layout relative to `ignorePath` (default: `sourceDir`).
 *
 * `bootstrap.ts` uses it as `symlinkDotfileDir(dotfiles, $HOME)`. Safe to run
 * any number of times, see {@link linkFile}.
 */
export async function symlinkDotfileDir(
  sourceDir: string,
  targetDir: string,
  ignorePath?: string,
  options: SymlinkDirOptions = {},
): Promise<SymlinkDirSummary> {
  const base = resolve(ignorePath || sourceDir)
  const entries = await readdir(sourceDir, { withFileTypes: true, recursive: true, encoding: 'utf-8' })

  const summary: SymlinkDirSummary = { created: 0, unchanged: 0, backedUp: 0, overwritten: 0, results: [] }
  const files = entries
    .filter(entry => entry.isFile() && isLinkableDotfile(entry.name))
    .map(entry => ({ entry, absolute: join(entry.parentPath, entry.name) }))
    .sort((a, b) => a.absolute.localeCompare(b.absolute))

  for (const { entry, absolute } of files) {
    const rel = relative(base, absolute)

    if (rel.startsWith('..')) {
      logger.debug(`Skipping ${absolute}: outside of ${base}`)
      continue
    }
    if (options.exclude?.(rel, entry)) {
      logger.debug(`Skipping ${absolute}: excluded`)
      continue
    }

    const targetPath = join(targetDir, rel)
    const result = await linkFile(absolute, targetPath, options)
    summary.results.push(result)

    // NOTE: In dry-run, `linkFile` already described what it would do.
    if (!(options.dryRun ?? config.dryRun) && result.status !== 'unchanged')
      logger.success(`Linked ${absolute} to ${targetPath}`)

    switch (result.status) {
      case 'unchanged':
        summary.unchanged++
        logger.debug(`Already linked ${targetPath}`)
        break
      case 'created':
        summary.created++
        break
      case 'backed-up':
        summary.backedUp++
        summary.created++
        break
      case 'overwritten':
        summary.overwritten++
        summary.created++
        break
      default:
        summary.created++
    }
  }

  const dry = options.dryRun ?? config.dryRun
  logger.info(`Symlinks${dry ? ' (dry run, nothing changed)' : ''}: ${summary.created} ${dry ? 'to link' : 'linked'}, ${summary.unchanged} already up to date, ${summary.backedUp} ${dry ? 'to back up' : 'backed up'}`)
  return summary
}

// ---------------------------------------------------------------------------
// Copying a tree (used when unpacking private files)
// ---------------------------------------------------------------------------

export interface MergeSummary {
  copied: number
  unchanged: number
  backedUp: number
}

/**
 * Copy every file from `sourceDir` into `destDir`. Identical files are
 * skipped; different ones are backed up first (or replaced with `backup: false`).
 */
export async function mergeDir(sourceDir: string, destDir: string, options: LinkOptions = {}): Promise<MergeSummary> {
  const backup = options.backup ?? config.backup
  const dryRun = options.dryRun ?? config.dryRun
  const summary: MergeSummary = { copied: 0, unchanged: 0, backedUp: 0 }

  const entries = await readdir(sourceDir, { withFileTypes: true, recursive: true, encoding: 'utf-8' })
  for (const entry of entries.filter(e => e.isFile())) {
    const absolute = join(entry.parentPath, entry.name)
    const target = join(destDir, relative(sourceDir, absolute))
    const existing = await lstatOrNull(target)

    if (existing?.isFile() && await filesEqual(absolute, target)) {
      summary.unchanged++
      continue
    }

    if (dryRun) {
      logger.dryRun(`${existing ? 'replace' : 'create'} ${target}`)
      summary.copied++
      continue
    }

    await mkdir(dirname(target), { recursive: true })
    if (existing) {
      if (backup) {
        const backupPath = await backupFile(target, options.backupSuffix)
        summary.backedUp++
        logger.warn(`Backed up existing ${target} to ${backupPath}`)
      }
      else {
        await rm(target, { recursive: true, force: true })
      }
    }
    await copyFile(absolute, target)
    summary.copied++
  }

  return summary
}

/** Resolve where a symlink points to, as an absolute path (or `null` when it is not a symlink). */
export async function readLinkTarget(path: string): Promise<string | null> {
  try {
    return resolve(dirname(path), await readlink(path))
  }
  catch {
    return null
  }
}
