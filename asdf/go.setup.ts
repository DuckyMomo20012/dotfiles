import { asdfInstallTool, logger } from '../lib/utils'

logger.info('Setting up asdf golang...')

await asdfInstallTool({ plugin: 'golang', version: '1.23.4', url: 'https://github.com/asdf-community/asdf-golang.git' })
