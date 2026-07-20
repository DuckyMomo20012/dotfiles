import process from 'node:process'
import { $ } from 'bun'
import { logger } from '../scripts/utils'

const asdfBin = (await $`which asdf`.text()).trim()
if (!asdfBin) {
  logger.error('asdf is not installed. Please install asdf first.')
  process.exit(1)
}

logger.info('Setting up asdf nodejs...')

await $`${asdfBin} plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git`

await $`${asdfBin} install nodejs lts`

await $`${asdfBin} global nodejs lts`

await $`${asdfBin} reshim nodejs`
