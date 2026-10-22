import { appendToShellRc, bash, cobraCompletion, ensureInstalled, logger } from '../lib/utils'

logger.info('Setting up k3d...')

await ensureInstalled('k3d', async () => {
  await bash('curl -fsSL https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash')
})

logger.info('Setup k3d autocompletion')
await appendToShellRc(cobraCompletion('k3d'))
