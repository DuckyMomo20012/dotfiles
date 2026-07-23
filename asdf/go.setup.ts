import { $ } from 'bun'
import { asdfBinPath } from '../lib/constants'
import { logger } from '../lib/utils'

logger.info('Setting up asdf golang...')

await $`${asdfBinPath} plugin add golang https://github.com/asdf-community/asdf-golang.git`

await $`${asdfBinPath} install golang 1.23.4`

await $`${asdfBinPath} set -u golang 1.23.4`

await $`${asdfBinPath} reshim golang`
