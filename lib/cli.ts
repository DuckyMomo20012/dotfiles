import type { ParseArgsOptionsConfig } from 'node:util'
import { setConfig } from './config'

/**
 * Options shared by every script that parses its own arguments.
 * Spread them into the script's `parseArgs` options:
 *
 * ```ts
 * const options = { ...commonOptions, email: { type: 'string', short: 'e' } } as const satisfies ParseArgsOptionsConfig
 * ```
 */
export const commonOptions = {
  'dry-run': { type: 'boolean', short: 'n' },
  'no-backup': { type: 'boolean' },
  'force': { type: 'boolean' },
  'verbose': { type: 'boolean', short: 'v' },
} as const satisfies ParseArgsOptionsConfig

export const commonHelp = `  -n, --dry-run       Show what would change, change nothing
      --no-backup     Overwrite existing files directly instead of backing them up
      --force         Reinstall tools that are already installed
  -v, --verbose       Print every command that is run`

interface CommonValues {
  'dry-run'?: boolean
  'no-backup'?: boolean
  'force'?: boolean
  'verbose'?: boolean
}

/** Apply the parsed common options to the global config (and so to child processes). */
export function applyCommonOptions(values: CommonValues) {
  setConfig({
    dryRun: values['dry-run'] || undefined,
    backup: values['no-backup'] ? false : undefined,
    force: values.force || undefined,
    verbose: values.verbose || undefined,
  })
}
