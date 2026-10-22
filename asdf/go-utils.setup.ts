import { asdfInstallTool, logger } from '../lib/utils'

logger.info('Setting up asdf protoc...')

await asdfInstallTool({ plugin: 'protoc', version: '29.3', url: 'https://github.com/paxosglobal/asdf-protoc.git' })

logger.info('Setting up asdf buf...')

await asdfInstallTool({ plugin: 'buf', version: '1.49.0', url: 'https://github.com/truepay/asdf-buf' })
