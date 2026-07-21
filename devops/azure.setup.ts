import { $ } from 'bun'
import { logger } from '../lib/utils'

logger.info('Setting up azure-cli...')

await $`curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash`
