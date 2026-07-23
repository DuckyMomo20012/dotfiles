import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { helmBinPath } from '../lib/constants'
import { appendUniqueLine, logger } from '../lib/utils'

logger.info('Setting up helm...')

await $`curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash`

logger.info('Installing helm plugins...')

const plugins = await $`${helmBinPath} plugin list`.text()

if (!plugins.includes('diff')) {
  await $`${helmBinPath} plugin install https://github.com/databus23/helm-diff`
}

if (await (exists(`${process.env.HOME}/.bashrc`))) {
  logger.info('Setup helm autocompletion for bash')
  await appendUniqueLine(`if command -v helm >/dev/null 2>&1; then source <(helm completion bash); fi`, `${process.env.HOME}/.bashrc`)
}

if (await (exists(`${process.env.HOME}/.zshrc`))) {
  logger.info('Setup helm autocompletion for zsh')
  await appendUniqueLine(`if command -v helm >/dev/null 2>&1; then source <(helm completion zsh); fi`, `${process.env.HOME}/.zshrc`)
}
