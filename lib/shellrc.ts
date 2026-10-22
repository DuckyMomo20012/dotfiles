import { join, resolve } from 'node:path'
import { getHome } from './constants'
import { appendUniqueLine, pathExists } from './files'
import { logger } from './logger'

export type Shell = 'bash' | 'zsh'

const RC_FILES: Record<Shell, string> = {
  bash: '.bashrc',
  zsh: '.zshrc',
}

type Lines = string | string[]

export interface ShellRcOptions {
  /** Shells to configure. Default: both. */
  shells?: Shell[]
  /**
   * Write to another file than `~/.bashrc` / `~/.zshrc` (path relative to `$HOME`
   * or absolute), e.g. `{ bash: '.bash_profile', zsh: '.zprofile' }`.
   * The shell is still only configured when its rc file exists.
   */
  files?: Partial<Record<Shell, string>>
}

/**
 * Add lines to the user's shell config, once. A shell is skipped when it is not
 * set up on this machine (its rc file does not exist). `lines` can be a function
 * when the content depends on the shell (completions, for example).
 *
 * Returns the files that changed.
 */
export async function appendToShellRc(lines: Lines | ((shell: Shell) => Lines), options: ShellRcOptions = {}): Promise<string[]> {
  const home = getHome()
  const changed: string[] = []

  for (const shell of options.shells ?? (['bash', 'zsh'] as Shell[])) {
    const rcFile = join(home, RC_FILES[shell])
    if (!(await pathExists(rcFile))) {
      logger.debug(`Skipping ${shell}: ${rcFile} does not exist`)
      continue
    }

    const configured = options.files?.[shell]
    const target = configured ? resolve(home, configured) : rcFile
    const resolved = typeof lines === 'function' ? lines(shell) : lines

    let touched = false
    for (const line of Array.isArray(resolved) ? resolved : [resolved]) {
      if (await appendUniqueLine(line, target))
        touched = true
    }

    if (touched) {
      logger.info(`Updated ${target}`)
      changed.push(target)
    }
    else {
      logger.debug(`${target} is already up to date`)
    }
  }

  return changed
}

/** Completion line for CLIs built with cobra (`<cmd> completion <shell>`): kubectl, helm, k3d... */
export function cobraCompletion(command: string, extra = ''): (shell: Shell) => string {
  return shell => `if command -v ${command} >/dev/null 2>&1; then source <(${command} completion ${shell});${extra} fi`
}
