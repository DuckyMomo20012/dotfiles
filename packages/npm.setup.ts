import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../lib/utils'

logger.info('Setup npm config...')

await $`mkdir -p ${process.env.HOME}/.npm-global`

await appendUniqueLine(`prefix=${process.env.HOME}/.npm-global`, `${process.env.HOME}/.npmrc`)

if (await (exists(`${process.env.HOME}/.bashrc`))) {
  logger.info('Adding npm global path to ~/.bashrc')
  await appendUniqueLine(`export PATH=\$HOME/.npm-global/bin:\$PATH`, `${process.env.HOME}/.bashrc`)
}

if (await (exists(`${process.env.HOME}/.zshrc`))) {
  logger.info('Adding npm global path to ~/.zshrc')
  await appendUniqueLine(`export PATH=\$HOME/.npm-global/bin:\$PATH`, `${process.env.HOME}/.zshrc`)
}
