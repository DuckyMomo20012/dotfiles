import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { chmod, mkdir, mkdtemp, readFile, rename, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { config } from './config'
import { CommandError } from './errors'
import { logger } from './logger'

// ---------------------------------------------------------------------------
// Process helpers
// ---------------------------------------------------------------------------

export function isRoot(): boolean {
  return process.getuid?.() === 0
}

/** `''` when already root (containers, CI), `'sudo'` otherwise. Handy inside `bash()` scripts. */
export const SUDO = isRoot() ? '' : 'sudo'

export function commandExists(command: string): boolean {
  return Bun.which(command) !== null
}

export interface ExecOptions {
  cwd?: string
  /** Extra environment variables. `undefined` removes a variable. */
  env?: Record<string, string | undefined>
  /** Run even with `--dry-run`. Use for commands that only read state. */
  readOnly?: boolean
  /** Do not throw on a non-zero exit code. */
  allowFailure?: boolean
  /** Capture stdout (returned in the result) instead of printing it. */
  capture?: boolean
  /** Silence stderr (and stdout, unless captured). Good for probes. */
  quiet?: boolean
  /** Written to the command's stdin. Without it, stdin is inherited so the command can prompt. */
  input?: string | Uint8Array
}

export interface ExecResult {
  exitCode: number
  stdout: string
}

function quoteArg(arg: string): string {
  return /^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, `'\\''`)}'`
}

/**
 * `sudo` is a no-op for root and is often not even installed in containers, so
 * drop it there. `sudo -u ...`/`sudo -E ...` are left alone on purpose.
 */
function normalizeSudo(cmd: string[]): string[] {
  if (cmd[0] === 'sudo' && isRoot() && cmd[1] !== undefined && !cmd[1].startsWith('-'))
    return cmd.slice(1)
  return cmd
}

/**
 * Run a command without a shell. Output goes straight to the terminal, so
 * password prompts and progress bars keep working (the reason `$` from `bun`
 * is avoided for `sudo`/`apt-get`).
 *
 * Honors `--dry-run`: mutating commands are only logged.
 */
export async function exec(cmd: string[], options: ExecOptions = {}): Promise<ExecResult> {
  const argv = normalizeSudo(cmd)
  const printable = argv.map(quoteArg).join(' ')

  if (config.dryRun && !options.readOnly) {
    logger.dryRun(`$ ${printable}`)
    return { exitCode: 0, stdout: '' }
  }

  logger.debug(`$ ${printable}`)

  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...process.env, ...options.env })) {
    if (value !== undefined)
      env[key] = value
  }

  const silent = options.quiet === true
  let proc: ReturnType<typeof Bun.spawn>
  try {
    proc = Bun.spawn(argv, {
      cwd: options.cwd,
      env,
      stdin: options.input !== undefined ? Buffer.from(options.input) : 'inherit',
      stdout: options.capture || silent ? (options.capture ? 'pipe' : 'ignore') : 'inherit',
      stderr: silent ? 'ignore' : 'inherit',
    })
  }
  catch (err) {
    // NOTE: Bun throws synchronously when the binary does not exist (ENOENT).
    if (options.allowFailure)
      return { exitCode: 127, stdout: '' }
    throw new CommandError(argv, 127, `Cannot run "${argv[0]}": ${err instanceof Error ? err.message : String(err)}`)
  }

  const [stdout, exitCode] = await Promise.all([
    options.capture ? new Response(proc.stdout as ReadableStream).text() : Promise.resolve(''),
    proc.exited,
  ])

  if (exitCode !== 0 && !options.allowFailure)
    throw new CommandError(argv, exitCode)

  return { exitCode, stdout }
}

/** Run a bash script string (with `pipefail`). Use `${SUDO}` for privileged pipe stages. */
export async function bash(script: string, options: ExecOptions = {}): Promise<ExecResult> {
  return exec(['bash', '-o', 'pipefail', '-c', script], options)
}

/** Run a read-only command and return trimmed stdout, or `null` when it fails. */
export async function capture(cmd: string[], options: ExecOptions = {}): Promise<string | null> {
  const { exitCode, stdout } = await exec(cmd, { ...options, readOnly: true, capture: true, quiet: true, allowFailure: true })
  return exitCode === 0 ? stdout.trim() : null
}

/** Run a read-only command and report whether it exited with 0. */
export async function succeeds(cmd: string[], options: ExecOptions = {}): Promise<boolean> {
  const { exitCode } = await exec(cmd, { ...options, readOnly: true, quiet: true, allowFailure: true })
  return exitCode === 0
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

export async function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  { attempts = 3, delayMs = 1000, label = 'operation' }: { attempts?: number, delayMs?: number, label?: string } = {},
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt)
    }
    catch (err) {
      lastError = err
      if (attempt < attempts) {
        logger.warn(`${label} failed (attempt ${attempt}/${attempts}): ${err instanceof Error ? err.message : String(err)}`)
        await sleep(delayMs * attempt)
      }
    }
  }
  throw lastError
}

/** Create a private temp directory, run `fn`, and always clean up. */
export async function withTempDir<T>(fn: (dir: string) => Promise<T>, prefix = 'dotfiles-'): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  try {
    return await fn(dir)
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** CPU architecture in the naming used by most Linux release assets. */
export function getArch(): 'amd64' | 'arm64' {
  if (process.arch === 'x64')
    return 'amd64'
  if (process.arch === 'arm64')
    return 'arm64'
  throw new Error(`Unsupported CPU architecture: ${process.arch}`)
}

/** Parse `/etc/os-release` into a key/value map (empty when the file is missing). */
export async function readOsRelease(path = '/etc/os-release'): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  let content = ''
  try {
    content = await readFile(path, 'utf8')
  }
  catch {
    return result
  }

  for (const line of content.split('\n')) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line.trim())
    if (match?.[1] !== undefined && match[2] !== undefined)
      result[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
  return result
}

/** Ubuntu codename (also correct on derivatives such as Linux Mint) or Debian codename. */
export async function getCodename(): Promise<string> {
  const os = await readOsRelease()
  const codename = os.UBUNTU_CODENAME || os.VERSION_CODENAME
  if (codename)
    return codename
  return (await capture(['lsb_release', '-cs'])) ?? ''
}

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

export interface DownloadOptions {
  retries?: number
  headers?: Record<string, string>
  /** File mode applied after download, e.g. `0o755`. */
  mode?: number
}

/** Download `url` to `dest` atomically (temp file + rename), with retries. */
export async function download(url: string, dest: string, options: DownloadOptions = {}): Promise<void> {
  if (config.dryRun) {
    logger.dryRun(`download ${url} -> ${dest}`)
    return
  }

  await mkdir(dirname(dest), { recursive: true })
  const partial = `${dest}.partial`

  await retry(async () => {
    const res = await fetch(url, { headers: options.headers, redirect: 'follow' })
    if (!res.ok)
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`)
    await Bun.write(partial, res)
  }, { attempts: options.retries ?? 3, label: `Download ${url}` })

  await rename(partial, dest)
  if (options.mode !== undefined)
    await chmod(dest, options.mode)
}

export async function fetchText(url: string, retries = 3): Promise<string> {
  return retry(async () => {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok)
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`)
    return (await res.text()).trim()
  }, { attempts: retries, label: `Fetch ${url}` })
}

export interface ReleaseAsset {
  name: string
  url: string
  tag: string
}

interface GithubRelease {
  tag_name: string
  assets?: { name: string, browser_download_url: string }[]
}

/**
 * Find a download URL in the latest GitHub release of `repo` (`owner/name`).
 * Set `GITHUB_TOKEN` to avoid the 60 requests/hour anonymous rate limit.
 */
export async function githubLatestAsset(repo: string, match: (assetName: string) => boolean): Promise<ReleaseAsset> {
  if (config.dryRun) {
    logger.dryRun(`resolve latest release asset of github.com/${repo}`)
    return { name: '<latest-asset>', url: `https://github.com/${repo}/releases/latest`, tag: 'latest' }
  }

  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const release = await retry(async () => {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers })
    if (res.status === 403 || res.status === 429)
      throw new Error(`GitHub API rate limit hit for ${repo}. Set GITHUB_TOKEN and retry.`)
    if (!res.ok)
      throw new Error(`GitHub API returned HTTP ${res.status} for ${repo}`)
    return await res.json() as GithubRelease
  }, { label: `GitHub release lookup for ${repo}` })

  const asset = release.assets?.find(a => match(a.name))
  if (!asset)
    throw new Error(`No matching asset found in the latest release (${release.tag_name}) of ${repo}`)

  return { name: asset.name, url: asset.browser_download_url, tag: release.tag_name }
}

// ---------------------------------------------------------------------------
// Install helpers
// ---------------------------------------------------------------------------

export interface EnsureInstalledOptions {
  /** Extra absolute paths that prove the tool exists (not on `PATH` yet, e.g. `~/.local/bin/uv`). */
  paths?: string[]
  /** Display name, defaults to `command`. */
  label?: string
}

export function isInstalled(command: string, paths: string[] = []): boolean {
  return commandExists(command) || paths.some(p => existsSync(p))
}

/**
 * Run `install` only when `command` is missing (or `--force` is given).
 * Returns `true` when the installer ran.
 */
export async function ensureInstalled(
  command: string,
  install: () => Promise<void>,
  options: EnsureInstalledOptions = {},
): Promise<boolean> {
  const label = options.label ?? command
  if (!config.force && isInstalled(command, options.paths)) {
    logger.info(`${label} is already installed, skipping (use --force to reinstall).`)
    return false
  }

  await install()
  return true
}

/** `install -m <mode> src dest`, through `sudo` when `dest` is not writable by the current user. */
export async function installBinary(src: string, dest: string, { mode = '0755', sudo = false }: { mode?: string, sudo?: boolean } = {}) {
  await exec([...(sudo ? ['sudo'] : []), 'install', '-D', '-m', mode, src, dest])
}

/** SHA-256 of a file, as lowercase hex. */
export async function sha256File(path: string): Promise<string> {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

/** Throw when `file` does not match the expected SHA-256 (skipped with `--dry-run`). */
export async function verifySha256(file: string, expected: string): Promise<void> {
  if (config.dryRun)
    return

  const actual = await sha256File(file)
  if (actual !== expected.trim().toLowerCase())
    throw new Error(`Checksum mismatch for ${file}: expected ${expected}, got ${actual}`)
  logger.debug(`Checksum OK for ${file}`)
}

/**
 * Extract `archive` (`.tar.gz`) and install the single file named `binaryName`
 * from it to `dest`, ignoring everything else in the archive (LICENSE, README...).
 */
export async function installBinaryFromTarGz(archive: string, binaryName: string, dest: string, options: { mode?: string, sudo?: boolean } = {}): Promise<void> {
  if (config.dryRun) {
    logger.dryRun(`extract ${binaryName} from ${archive} to ${dest}`)
    return
  }

  await withTempDir(async (dir) => {
    await exec(['tar', '-xzf', archive, '-C', dir])

    const [found] = await Array.fromAsync(new Bun.Glob(`**/${binaryName}`).scan({ cwd: dir, onlyFiles: true }))
    if (found === undefined)
      throw new Error(`${archive} does not contain a file named "${binaryName}"`)

    await installBinary(join(dir, found), dest, options)
  })
}

// ---------------------------------------------------------------------------
// sudo keep-alive
// ---------------------------------------------------------------------------

/**
 * Ask for the sudo password once and keep the credentials fresh until the
 * process exits, so a long bootstrap does not stop at a password prompt.
 *
 * It is a no-op for root, when `sudo` is missing, and with `--dry-run`.
 * Returns a function that stops the keep-alive and drops the credentials.
 */
export async function startSudo(): Promise<() => Promise<void>> {
  const noop = async () => {}
  if (isRoot() || !commandExists('sudo') || config.dryRun)
    return noop

  // Passwordless sudo needs neither a prompt nor a keep-alive.
  if (await succeeds(['sudo', '-n', 'true']))
    return noop

  // NOTE: Inherit stdio here, the password prompt needs the terminal.
  const { exitCode } = await exec(['sudo', '-v'], { readOnly: true, allowFailure: true })
  if (exitCode !== 0)
    throw new Error('Failed to start a sudo session. Check your sudo configuration.')
  logger.info('Sudo session started. Keeping it alive...')

  let stopped = false
  // eslint-disable-next-line ts/no-misused-promises
  const interval = setInterval(async () => {
    if (!(await succeeds(['sudo', '-n', '-v'])))
      logger.warn('Sudo refresh failed.')
  }, 4 * 60 * 1000)
  // Do not keep the process alive just for the timer.
  interval.unref()

  const stop = async () => {
    if (stopped)
      return
    stopped = true
    clearInterval(interval)
    await succeeds(['sudo', '-k'])
  }

  // Drop the credentials on exit, including after Ctrl+C / `kill`.
  process.on('exit', () => {
    if (!stopped)
      Bun.spawnSync(['sudo', '-k'])
  })
  process.on('SIGINT', () => void stop().finally(() => process.exit(130)))
  process.on('SIGTERM', () => void stop().finally(() => process.exit(143)))

  return stop
}
