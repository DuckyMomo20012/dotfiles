import { basename, dirname, join, normalize, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { bunBinPath, ROOT_DIR } from './constants'
import { SetupFailedError } from './errors'
import { logger } from './logger'

export const isMainSetupFile = (file: string) => basename(file) === 'setup.ts'

export interface RunSetupOptions {
  /** In a directory that has a `setup.ts`, run only that file and skip its siblings. */
  runMainSetupOnly?: boolean
  /** Skip files whose path (relative to the repository root) contains one of these strings. */
  ignores?: string[]
  /** Run only files whose path (relative to the repository root) contains one of these strings. */
  only?: string[]
  /**
   * Directories (relative to the searched directory) that run first, in this order.
   * The rest follow alphabetically. Use it for dependencies, e.g. `['packages']`.
   */
  priority?: string[]
  /** Run the remaining files after one failed and report at the end. Default: stop at the first failure. */
  keepGoing?: boolean
  /** Extra environment variables for the setup processes. */
  env?: Record<string, string>
  /** Working directory of the setup processes. Default: the current one. */
  cwd?: string
}

export interface RunSetupResult {
  ran: string[]
  skipped: string[]
  failed: { file: string, exitCode: number }[]
}

/** Files that are never setup scripts even though their name matches. */
function isExcluded(rel: string, abs: string): boolean {
  const segments = rel.split(sep)
  if (segments.includes('node_modules') || segments.includes('.git'))
    return true

  // Disabled examples, e.g. `private/dotfiles-example/!setup.ts`.
  if (basename(rel).startsWith('!'))
    return true

  // This repository's own tooling is not a setup script.
  return [join(ROOT_DIR, 'lib'), join(ROOT_DIR, 'tests')].some(dir => abs.startsWith(`${dir}${sep}`))
}

/** Find every `*setup.ts` under `dir`, as paths relative to `dir`. */
export async function findSetupFiles(dir: string): Promise<string[]> {
  const root = resolve(dir)
  const files: string[] = []

  for await (const rel of new Bun.Glob('**/*setup.ts').scan({ cwd: root, dot: true, onlyFiles: true })) {
    if (!isExcluded(rel, join(root, rel)))
      files.push(normalize(rel))
  }

  return files
}

function priorityIndex(dirRel: string, priority: string[]): number {
  const index = priority.findIndex(p => dirRel === p || dirRel.startsWith(`${p}${sep}`))
  return index === -1 ? priority.length : index
}

/**
 * Find and run setup files in `dir`, one process each (`bun run <file>`).
 *
 * Order is deterministic: `priority` directories first, then alphabetical by
 * directory; inside a directory `setup.ts` goes first, then `*.setup.ts`.
 * Global switches (`--dry-run`, `--no-backup`, ...) reach the children through
 * `DOTFILES_*` environment variables.
 */
export async function runSetupFilesInDir(dir: string, options: RunSetupOptions = {}): Promise<RunSetupResult> {
  const { runMainSetupOnly = false, ignores = [], only = [], priority = [], keepGoing = false } = options
  const result: RunSetupResult = { ran: [], skipped: [], failed: [] }

  logger.info(`Searching for setup files in directory: "${normalize(dir)}"`)

  // NOTE: `ignores`/`only` match the path relative to the repository root
  // (`devops/helm.setup.ts`), so the same value works for every directory.
  const matchPath = (rel: string) => {
    const fromRoot = relative(ROOT_DIR, join(resolve(dir), rel))
    return fromRoot.startsWith('..') ? rel : fromRoot
  }

  const found = await findSetupFiles(dir)
  const selected = found.filter((rel) => {
    const path = matchPath(rel)
    if (ignores.some(ignore => path.includes(ignore))) {
      logger.debug(`Ignoring setup file "${rel}" due to ignore patterns.`)
      result.skipped.push(rel)
      return false
    }
    if (only.length > 0 && !only.some(name => path.includes(name))) {
      logger.debug(`Skipping setup file "${rel}": not selected with --only.`)
      result.skipped.push(rel)
      return false
    }
    return true
  })

  if (selected.length === 0) {
    if (found.length === 0)
      logger.warn(`No setup files found in directory: "${normalize(dir)}"`)
    else
      logger.debug(`No setup files left to run in directory: "${normalize(dir)}"`)
    return result
  }

  const byDir = new Map<string, string[]>()
  for (const rel of selected) {
    const key = dirname(rel)
    byDir.set(key, [...(byDir.get(key) ?? []), rel])
  }

  const orderedDirs = [...byDir.keys()].sort((a, b) =>
    priorityIndex(a, priority) - priorityIndex(b, priority) || a.localeCompare(b),
  )

  for (const dirRel of orderedDirs) {
    const files = byDir.get(dirRel) ?? []
    logger.info(`Running setup files in directory: "${join(dir, dirRel)}"`)

    const sorted = files.sort((a, b) => {
      const aIsMain = isMainSetupFile(a)
      const bIsMain = isMainSetupFile(b)
      if (aIsMain !== bIsMain)
        return aIsMain ? -1 : 1
      return a.localeCompare(b)
    })

    const hasMain = sorted.some(isMainSetupFile)
    for (const rel of sorted) {
      if (runMainSetupOnly && hasMain && !isMainSetupFile(rel)) {
        logger.warn(`Ignoring setup file "${rel}" because "${join(dirRel, 'setup.ts')}" exists.`)
        result.skipped.push(rel)
        continue
      }

      const file = join(dir, rel)
      logger.info(`Running setup file: ${file}`)

      const started = performance.now()
      const proc = Bun.spawn([bunBinPath, 'run', resolve(file)], {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
      })
      const status = await proc.exited
      const seconds = ((performance.now() - started) / 1000).toFixed(1)

      if (status === 0) {
        result.ran.push(rel)
        logger.debug(`Finished ${file} in ${seconds}s`)
        continue
      }

      logger.error(`Setup file "${file}" failed with exit code: ${status}`)
      result.failed.push({ file, exitCode: status })
      if (!keepGoing)
        throw new SetupFailedError(result.failed)
    }
  }

  return result
}
