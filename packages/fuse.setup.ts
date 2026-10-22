import { aptInstall, aptUpdate, exec, isPackageInstalled, logger } from '../lib/utils'

logger.info('Installing Fuse...')

// NOTE: Setup for AppImage
// Ref: https://github.com/AppImage/AppImageKit/wiki/FUSE

// NOTE: Ubuntu 24.04 renamed the package to `libfuse2t64`.
if (await isPackageInstalled('libfuse2') || await isPackageInstalled('libfuse2t64')) {
  logger.info('libfuse2 is already installed, skipping.')
}
else {
  await aptInstall(['software-properties-common'])

  await exec(['sudo', 'add-apt-repository', 'universe', '-y'])

  await aptUpdate({ maxAgeMinutes: 0 })

  await aptInstall(['libfuse2'])
}
