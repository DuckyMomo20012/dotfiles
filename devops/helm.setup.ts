import { exists } from 'node:fs/promises'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../scripts/utils'

logger.info('Setting up helm...')

await $`curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash`

logger.info('Installing helm plugins...')

await $`helm plugin install https://github.com/databus23/helm-diff`

if (await (exists('~/.bashrc'))) {
  logger.info('Setup helm autocompletion for bash')
  await appendUniqueLine(`if command -v helm >/dev/null 2>&1; then source <(helm completion bash); fi" "$HOME/.bashrc`, '~/.bashrc')
}

if (await (exists('~/.zshrc'))) {
  logger.info('Setup helm autocompletion for zsh')
  await appendUniqueLine(`if command -v helm >/dev/null 2>&1; then source <(helm completion zsh); fi" "$HOME/.zshrc`, '~/.zshrc')
}
