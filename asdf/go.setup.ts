import process from 'node:process'
import { $ } from 'bun'
import { logger } from '../scripts/utils'

const asdfBin = (await $`which asdf`.text()).trim()
if (!asdfBin) {
  logger.error('asdf is not installed. Please install asdf first.')
  process.exit(1)
}

logger.info('Setting up asdf golang...')

await $`${asdfBin} plugin add golang https://github.com/asdf-community/asdf-golang.git`

await $`${asdfBin} install golang 1.23.4`

await $`${asdfBin} global golang 1.23.4`

await $`${asdfBin} reshim golang`
