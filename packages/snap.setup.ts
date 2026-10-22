import { commandExists, exec, logger, succeeds } from '../lib/utils'

logger.info('Installing Snap packages...')

const packages = [
  'vlc',
].filter(pkg => !pkg.startsWith('!'))

if (!commandExists('snap')) {
  logger.warn('snap is not available on this system, skipping snap packages.')
}
else {
  for (const pkg of packages) {
    if (await succeeds(['snap', 'list', pkg]))
      logger.info(`snap package "${pkg}" is already installed.`)
    else
      await exec(['sudo', 'snap', 'install', pkg])
  }
}
