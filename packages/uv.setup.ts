import { join } from 'node:path'
import { appendToShellRc, bash, ensureInstalled, getHome, logger } from '../lib/utils'

logger.info('Installing uv...')

await ensureInstalled('uv', async () => {
  await bash('curl -LsSf https://astral.sh/uv/install.sh | sh')
}, { paths: [join(getHome(), '.local', 'bin', 'uv')] })

logger.info('Setup uv/uvx autocompletion')
await appendToShellRc(shell => [
  `if command -v uv >/dev/null 2>&1; then source <(eval "$(uv generate-shell-completion ${shell})"); fi`,
  `if command -v uvx >/dev/null 2>&1; then source <(eval "$(uvx --generate-shell-completion ${shell})"); fi`,
])
