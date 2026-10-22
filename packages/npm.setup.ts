import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { appendToShellRc, appendUniqueLine, config, getHome, logger } from '../lib/utils'

logger.info('Setup npm config...')

const home = getHome()

if (!config.dryRun)
  await mkdir(join(home, '.npm-global'), { recursive: true })

await appendUniqueLine(`prefix=${home}/.npm-global`, join(home, '.npmrc'))

logger.info('Adding npm global path to shell config')
await appendToShellRc(`export PATH=\$HOME/.npm-global/bin:\$PATH`)
