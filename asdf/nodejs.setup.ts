import { asdfInstallTool, logger } from '../lib/utils'

logger.info('Setting up asdf nodejs...')

await asdfInstallTool({ plugin: 'nodejs', version: 'lts', url: 'https://github.com/asdf-vm/asdf-nodejs.git' })
