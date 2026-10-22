import { appendToShellRc, bash, capture, cobraCompletion, ensureInstalled, exec, helmBinPath, logger } from '../lib/utils'

logger.info('Setting up helm...')

await ensureInstalled('helm', async () => {
  await bash('curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash')
}, { paths: [helmBinPath] })

logger.info('Installing helm plugins...')

const plugins = await capture([helmBinPath, 'plugin', 'list']) ?? ''

// NOTE: `helm plugin list` prints a table, the plugin name is the first column.
if (!plugins.split('\n').some(line => line.split(/\s+/)[0] === 'diff')) {
  await exec([helmBinPath, 'plugin', 'install', 'https://github.com/databus23/helm-diff'])
}
else {
  logger.info('helm plugin "diff" is already installed.')
}

logger.info('Setup helm autocompletion')
await appendToShellRc(cobraCompletion('helm'))
