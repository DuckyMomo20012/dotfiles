import { $ } from 'bun'
import { asdfBinPath } from '../lib/constants'
import { logger } from '../lib/utils'

logger.info('Setting up asdf java...')

await $`${asdfBinPath} plugin add java https://github.com/halcyon/asdf-java.git`

await $`${asdfBinPath} install java adoptopenjdk-17.0.14+7`

await $`${asdfBinPath} set -u java adoptopenjdk-17.0.14+7`

await $`${asdfBinPath} reshim java`
