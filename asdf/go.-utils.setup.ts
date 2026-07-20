import process from 'node:process'
import { $ } from 'bun'
import { logger } from '../scripts/utils'

const asdfBin = (await $`which asdf`.text()).trim()
if (!asdfBin) {
  logger.error('asdf is not installed. Please install asdf first.')
  process.exit(1)
}

logger.info('Setting up asdf protoc...')

await $`${asdfBin} plugin add protoc https://github.com/paxosglobal/asdf-protoc.git`

await $`${asdfBin} install protoc 29.3`

await $`${asdfBin} global protoc 29.3`

await $`${asdfBin} reshim protoc`

logger.info('Setting up asdf buf...')

await $`${asdfBin} plugin add buf https://github.com/truepay/asdf-buf`

await $`${asdfBin} install buf 1.49.0`

await $`${asdfBin} global buf 1.49.0`

await $`${asdfBin} reshim buf`
