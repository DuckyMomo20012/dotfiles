import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../lib/utils'

logger.info('Setting up kustomize...')

await $`curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"  | bash`

await $`sudo mv kustomize /usr/local/bin`

if (await (exists(`${process.env.HOME}/.bashrc`))) {
  logger.info('Setup kustomize autocompletion for bash')
  await appendUniqueLine(`if command -v kustomize >/dev/null 2>&1; then source <(kustomize completion bash); fi`, `${process.env.HOME}/.bashrc`)
}

if (await (exists(`${process.env.HOME}/.zshrc`))) {
  logger.info('Setup kustomize autocompletion for zsh')
  await appendUniqueLine(`if command -v kustomize >/dev/null 2>&1; then source <(kustomize completion zsh); fi`, `${process.env.HOME}/.zshrc`)
}
