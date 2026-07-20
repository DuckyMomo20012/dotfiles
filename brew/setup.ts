import { exists } from 'node:fs/promises'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../scripts/utils'

logger.info('Setting up brew...')

await $`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

if (await (exists('~/.bashrc'))) {
  logger.info('Adding brew to ~/.bashrc')
  await appendUniqueLine(`export PATH="/home/linuxbrew/.linuxbrew/bin:\$PATH"`, '~/.bashrc')
}

if (await (exists('~/.zshrc'))) {
  logger.info('Adding brew to ~/.zshrc')
  await appendUniqueLine(`export PATH="/home/linuxbrew/.linuxbrew/bin:\$PATH"`, '~/.zshrc')
}

logger.info('Installing brew packages from Brewfile...')
await $`brew bundle --file=./Brewfile`
