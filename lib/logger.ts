import process from 'node:process'
import { styleText } from 'node:util'
import { config } from './config'

type Format = Parameters<typeof styleText>[0]

function colorEnabled(): boolean {
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '')
    return false
  if (process.env.FORCE_COLOR !== undefined && process.env.FORCE_COLOR !== '0')
    return true
  return process.stdout.isTTY === true
}

function paint(format: Format, message: string): string {
  return colorEnabled() ? styleText(format, message) : message
}

export const logger = {
  info: (msg: string) => console.log(paint('cyan', msg)),
  success: (msg: string) => console.log(paint('green', msg)),
  warn: (msg: string) => console.warn(paint('yellow', msg)),
  error: (msg: string) => console.error(paint(['red', 'bold'], msg)),
  /** Only printed with `--verbose` / `DOTFILES_VERBOSE=1`. */
  debug: (msg: string) => {
    if (config.verbose)
      console.log(paint('gray', msg))
  },
  /** Describes a change that was skipped because of `--dry-run`. */
  dryRun: (msg: string) => console.log(paint('magenta', `[dry-run] ${msg}`)),
}
