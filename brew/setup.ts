import { exists } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { $ } from 'bun'
import { brewBinPath } from '../lib/constants'
import { appendUniqueLine, logger } from '../lib/utils'

logger.info('Setting up brew...')

await $`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`.env({
  ...process.env,
  NONINTERACTIVE: '1',
})

if (await (exists(`${process.env.HOME}/.bashrc`))) {
  logger.info('Adding brew to ~/.bashrc')
  await appendUniqueLine(`export PATH=/home/linuxbrew/.linuxbrew/bin:\$PATH`, `${process.env.HOME}/.bashrc`)
}

if (await (exists(`${process.env.HOME}/.zshrc`))) {
  logger.info('Adding brew to ~/.zshrc')
  await appendUniqueLine(`export PATH=/home/linuxbrew/.linuxbrew/bin:\$PATH`, `${process.env.HOME}/.zshrc`)
}

logger.info('Installing brew packages from Brewfile...')
await $`${brewBinPath} bundle --file=${join(__dirname, './Brewfile')}`
