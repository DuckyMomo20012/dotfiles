import { aptInstallDebFiles, aptUpdate, logger } from '../lib/utils'

// NOTE: Only look next to this script, not in the whole working directory.
const files = (await Array.fromAsync(new Bun.Glob('**/*.deb').scan({ cwd: __dirname, absolute: true, onlyFiles: true }))).sort()

if (files.length === 0) {
  logger.warn(`No .deb files found in ${__dirname}.`)
}
else {
  logger.info(`Found ${files.length} .deb file(s):`)
  for (const file of files) {
    logger.info(`- ${file}`)
  }

  logger.info('Installing deb packages...')
  await aptUpdate()
  await aptInstallDebFiles(files)
  logger.info('Deb packages installed successfully.')
}
