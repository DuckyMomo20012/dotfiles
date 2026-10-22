import process from 'node:process'
import { config } from './config'
import { logger } from './logger'

export class CommandError extends Error {
  constructor(
    readonly command: string[],
    readonly exitCode: number,
    message?: string,
  ) {
    super(message ?? `Command failed with exit code ${exitCode}: ${command.join(' ')}`)
    this.name = 'CommandError'
  }
}

export class SetupFailedError extends Error {
  constructor(readonly failures: { file: string, exitCode: number }[]) {
    super(`Setup file(s) failed: ${failures.map(f => `${f.file} (exit ${f.exitCode})`).join(', ')}`)
    this.name = 'SetupFailedError'
  }
}

let handlersInstalled = false

/**
 * Print uncaught errors as one readable line (full stack with `--verbose`)
 * instead of a raw stack trace, and exit with a non-zero code.
 */
export function installErrorHandlers() {
  if (handlersInstalled || process.env.DOTFILES_NO_ERROR_HANDLER)
    return
  handlersInstalled = true

  const onError = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(`Error: ${message}`)
    if (config.verbose && err instanceof Error && err.stack)
      console.error(err.stack)
    process.exit(err instanceof CommandError && err.exitCode > 0 ? err.exitCode : 1)
  }

  process.on('uncaughtException', onError)
  process.on('unhandledRejection', onError)
}
