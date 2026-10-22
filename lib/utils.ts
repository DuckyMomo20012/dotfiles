/**
 * Public API of the helper library. Setup scripts import everything from here:
 *
 * ```ts
 * import { logger, symlinkDotfileDir } from '../lib/utils'
 * ```
 *
 * The implementation is split into small modules; see `lib/README.md`.
 */
import process from 'node:process'
import { configFromArgv, setConfig } from './config'
import { installErrorHandlers } from './errors'

// NOTE: Every script that imports the library understands the global flags
// (`--dry-run`, `--no-backup`, `--force`, `--verbose`) and prints errors nicely.
setConfig(configFromArgv(process.argv.slice(2)))
installErrorHandlers()

export * from './apt'
export * from './asdf'
export * from './cli'
export * from './config'
export * from './constants'
export * from './errors'
export * from './files'
export * from './git'
export * from './gpg'
export * from './logger'
export * from './root'
export * from './runner'
export * from './shell'
export * from './shellrc'
