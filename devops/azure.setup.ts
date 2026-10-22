import { bash, ensureInstalled, logger, SUDO } from '../lib/utils'

logger.info('Setting up azure-cli...')

await ensureInstalled('az', async () => {
  await bash(`curl -fsSL https://aka.ms/InstallAzureCLIDeb | ${SUDO} bash`)
}, { label: 'azure-cli' })
