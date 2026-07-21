import { exists } from 'node:fs/promises'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../scripts/utils'

logger.info('Setting up kustomize...')

await $`curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"  | bash`

await $`sudo mv kustomize /usr/local/bin`

if (await (exists('~/.bashrc'))) {
  logger.info('Setup kustomize autocompletion for bash')
  await appendUniqueLine(`if command -v kustomize >/dev/null 2>&1; then source <(kustomize completion bash); fi" "$HOME/.bashrc`, '~/.bashrc')
}

if (await (exists('~/.zshrc'))) {
  logger.info('Setup kustomize autocompletion for zsh')
  await appendUniqueLine(`if command -v kustomize >/dev/null 2>&1; then source <(kustomize completion zsh); fi" "$HOME/.zshrc`, '~/.zshrc')
}
