import process from 'node:process'

/**
 * Global switches shared by every script in this repository.
 *
 * They live in environment variables (`DOTFILES_*`) on purpose: `bootstrap.ts`
 * spawns every setup file in its own process, and environment variables are the
 * simplest way to hand the same settings down to all of them.
 *
 * | Env var                | CLI flag      | Effect                                   |
 * | ---------------------- | ------------- | ---------------------------------------- |
 * | `DOTFILES_DRY_RUN`     | `--dry-run`   | Log every change, do not perform it      |
 * | `DOTFILES_NO_BACKUP`   | `--no-backup` | Overwrite existing files without backup  |
 * | `DOTFILES_FORCE`       | `--force`     | Reinstall tools that are already present |
 * | `DOTFILES_VERBOSE`     | `--verbose`   | Print debug output (every command run)   |
 */
const FALSY = new Set(['', '0', 'false', 'no', 'off'])

export function isTruthy(value: string | undefined): boolean {
  return value !== undefined && !FALSY.has(value.trim().toLowerCase())
}

export const config = {
  get dryRun() {
    return isTruthy(process.env.DOTFILES_DRY_RUN)
  },
  /** `true` unless `--no-backup` / `DOTFILES_NO_BACKUP` is set. */
  get backup() {
    return !isTruthy(process.env.DOTFILES_NO_BACKUP)
  },
  get force() {
    return isTruthy(process.env.DOTFILES_FORCE)
  },
  get verbose() {
    return isTruthy(process.env.DOTFILES_VERBOSE)
  },
}

export interface ConfigInput {
  dryRun?: boolean
  backup?: boolean
  force?: boolean
  verbose?: boolean
}

function setFlag(name: string, on: boolean | undefined) {
  if (on === undefined)
    return
  if (on)
    process.env[name] = '1'
  else
    delete process.env[name]
}

/** Update the global switches (and therefore every child process spawned later). */
export function setConfig(input: ConfigInput) {
  setFlag('DOTFILES_DRY_RUN', input.dryRun)
  setFlag('DOTFILES_FORCE', input.force)
  setFlag('DOTFILES_VERBOSE', input.verbose)
  // NOTE: The env var is the negative form (`NO_BACKUP`), so invert here.
  setFlag('DOTFILES_NO_BACKUP', input.backup === undefined ? undefined : !input.backup)
}

/**
 * Pick the global long flags out of an argv array, ignoring everything else.
 * This lets any script (`bun brew/setup.ts --dry-run`) honor the global
 * switches without declaring them in its own option parser.
 */
export function configFromArgv(argv: readonly string[]): ConfigInput {
  const input: ConfigInput = {}
  for (const arg of argv) {
    if (arg === '--dry-run')
      input.dryRun = true
    else if (arg === '--no-backup')
      input.backup = false
    else if (arg === '--force')
      input.force = true
    else if (arg === '--verbose')
      input.verbose = true
  }
  return input
}
