import { $ } from 'bun'
import { asdfBinPath } from '../lib/constants'
import { logger } from '../lib/utils'

logger.info('Setting up asdf nodejs...')

await $`${asdfBinPath} plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git`

await $`export PATH="${asdfBinPath}:$PATH && ${asdfBinPath} install nodejs lts`

await $`${asdfBinPath} set -u nodejs lts`

await $`${asdfBinPath} reshim nodejs`
