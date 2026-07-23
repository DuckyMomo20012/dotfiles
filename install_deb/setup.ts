import { $ } from 'bun'
import { logger, prettyAptInstall } from '../lib/utils'

const files = (await Array.fromAsync($`find . -type f -name "*.deb"`.lines())).filter(Boolean)

if (files.length === 0) {
  logger.warn('No .deb files found in the current directory.')
}
else {
  logger.info(`Found ${files.length} .deb file(s):`)
  for (const file of files) {
    logger.info(`- ${file}`)
  }

  logger.info('Installing deb packages...')
  await prettyAptInstall(`sudo apt-get update`)
  await prettyAptInstall(`sudo apt-get install -y ${files.join(' ')}`)
  logger.info('Deb packages installed successfully.')
}
