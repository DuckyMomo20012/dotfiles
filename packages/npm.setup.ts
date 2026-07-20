import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../scripts/utils'

logger.info('Setup npm config...')

await $`mkdir -p ${process.env.HOME}/.npm-global`

await appendUniqueLine(`prefix=${process.env.HOME}/.npm-global`, `${process.env.HOME}/.npmrc`)

if (await (exists('~/.bashrc'))) {
  logger.info('Adding npm global path to ~/.bashrc')
  await appendUniqueLine(`export PATH=\$HOME/.npm-global/bin:\$PATH`, '~/.bashrc')
}

if (await (exists('~/.zshrc'))) {
  logger.info('Adding npm global path to ~/.zshrc')
  await appendUniqueLine(`export PATH=\$HOME/.npm-global/bin:\$PATH`, '~/.zshrc')
}
