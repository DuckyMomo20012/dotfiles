import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import process from 'node:process'

/** Absolute path of the repository root (the parent of `lib/`). */
export const ROOT_DIR = resolve(import.meta.dir, '..')
/** Directory holding the dotfiles that get symlinked into `$HOME`. */
export const DOTFILES_DIR = join(ROOT_DIR, 'dotfiles')
/** Directory holding the (encrypted) private dotfiles. */
export const PRIVATE_DIR = join(ROOT_DIR, 'private')

/** Home directory of the current user. Read lazily so tests can override `$HOME`. */
export function getHome(): string {
  return process.env.HOME || homedir()
}

function resolveBunPath(): string {
  const installed = join(getHome(), '.bun', 'bin', 'bun')
  if (existsSync(installed))
    return installed

  // NOTE: Fall back to the binary that is running this script (e.g. bun was
  // installed through a package manager and is not under `~/.bun`).
  return basename(process.execPath).startsWith('bun') ? process.execPath : installed
}

export const bunBinPath = resolveBunPath()
export const asdfBinPath = join(getHome(), '.asdf', 'bin', 'asdf')
export const brewBinPath = `/home/linuxbrew/.linuxbrew/bin/brew`
export const helmBinPath = `/usr/local/bin/helm`
