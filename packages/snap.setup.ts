import { $ } from 'bun'
import { logger } from '../scripts/utils'

logger.info('Installing Snap packages...')

const packages = [
  'vlc',
].filter(pkg => !pkg.startsWith('!'))

await $`sudo snap install ${packages.join(' ')}`
