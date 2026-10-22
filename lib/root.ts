import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { config } from './config'
import { logger } from './logger'
import { exec, withTempDir } from './shell'

/**
 * Write a root-owned file (through `sudo install`) only when its content would
 * change. Returns `true` when the file was (or would be) written.
 */
export async function writeRootFile(path: string, content: string | Uint8Array, { mode = '0644' }: { mode?: string } = {}): Promise<boolean> {
  const wanted = Buffer.from(content)

  try {
    if ((await readFile(path)).equals(wanted))
      return false
  }
  catch {
    // Missing or unreadable: (re)write it.
  }

  if (config.dryRun) {
    logger.dryRun(`write ${path}`)
    return true
  }

  await withTempDir(async (dir) => {
    const tmp = join(dir, 'content')
    await writeFile(tmp, wanted, { mode: 0o600 })
    await exec(['sudo', 'install', '-D', '-m', mode, tmp, path])
  }, 'dotfiles-root-')
  return true
}

/** Append `line` to a root-owned file unless it is already there (replaces `tee -a`). */
export async function appendRootLine(path: string, line: string): Promise<boolean> {
  let content = ''
  try {
    content = await readFile(path, 'utf8')
  }
  catch {
    // Missing: created below.
  }

  if (content.split('\n').some(existing => existing.trimEnd() === line.trimEnd()))
    return false

  const separator = content === '' || content.endsWith('\n') ? '' : '\n'
  return writeRootFile(path, `${content}${separator}${line}\n`)
}
