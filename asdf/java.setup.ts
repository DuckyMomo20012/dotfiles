import process from 'node:process'
import { $ } from 'bun'
import { logger } from '../scripts/utils'

const asdfBin = (await $`which asdf`.text()).trim()
if (!asdfBin) {
  logger.error('asdf is not installed. Please install asdf first.')
  process.exit(1)
}

logger.info('Setting up asdf java...')

await $`${asdfBin} plugin add java https://github.com/halcyon/asdf-java.git`

await $`${asdfBin} install java adoptopenjdk-17.0.14+7`

await $`${asdfBin} global java adoptopenjdk-17.0.14+7`

await $`${asdfBin} reshim java`
