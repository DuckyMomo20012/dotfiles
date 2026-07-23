import { $ } from 'bun'
import { asdfBinPath } from '../lib/constants'
import { logger } from '../lib/utils'

logger.info('Setting up asdf protoc...')

await $`${asdfBinPath} plugin add protoc https://github.com/paxosglobal/asdf-protoc.git`

await $`${asdfBinPath} install protoc 29.3`

await $`${asdfBinPath} set -u protoc 29.3`

await $`${asdfBinPath} reshim protoc`

logger.info('Setting up asdf buf...')

await $`${asdfBinPath} plugin add buf https://github.com/truepay/asdf-buf`

await $`${asdfBinPath} install buf 1.49.0`

await $`${asdfBinPath} set -u buf 1.49.0`

await $`${asdfBinPath} reshim buf`
