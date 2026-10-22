import { asdfInstallTool, logger } from '../lib/utils'

logger.info('Setting up asdf java...')

await asdfInstallTool({ plugin: 'java', version: 'adoptopenjdk-17.0.14+7', url: 'https://github.com/halcyon/asdf-java.git' })
