import { join } from 'node:path'
import process from 'node:process'
import { asdfBinPath, getHome } from './constants'
import { logger } from './logger'
import { capture, exec, succeeds } from './shell'

/** Environment for asdf and the plugin scripts it spawns (they expect `asdf` on `PATH`). */
export function asdfEnv(): Record<string, string> {
  const home = getHome()
  return {
    PATH: `${join(home, '.asdf', 'bin')}:${join(home, '.asdf', 'shims')}:${process.env.PATH ?? ''}`,
  }
}

export interface AsdfToolOptions {
  plugin: string
  version: string
  /** Plugin git URL. Omit for plugins asdf already knows about. */
  url?: string
  /** Pin the version in `~/.tool-versions` (`asdf set -u`). Default `true`. */
  global?: boolean
}

/**
 * Install one asdf tool end to end: plugin, version, global pin, shims.
 * Every step is skipped when it is already done, so it is safe to re-run.
 */
export async function asdfInstallTool({ plugin, version, url, global = true }: AsdfToolOptions): Promise<void> {
  const env = asdfEnv()

  const plugins = await capture([asdfBinPath, 'plugin', 'list'], { env })
  if (plugins?.split('\n').map(p => p.trim()).includes(plugin)) {
    logger.info(`asdf plugin "${plugin}" is already added.`)
  }
  else {
    await exec([asdfBinPath, 'plugin', 'add', plugin, ...(url ? [url] : [])], { env })
  }

  if (await succeeds([asdfBinPath, 'where', plugin, version], { env })) {
    logger.info(`${plugin} ${version} is already installed.`)
  }
  else {
    await exec([asdfBinPath, 'install', plugin, version], { env })
  }

  if (global)
    await exec([asdfBinPath, 'set', '-u', plugin, version], { env })

  await exec([asdfBinPath, 'reshim', plugin], { env })
}
