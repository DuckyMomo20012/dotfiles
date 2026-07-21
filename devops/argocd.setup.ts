import { exists } from 'node:fs/promises'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../scripts/utils'

logger.info('Setting up ArgoCD...')

await $`curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64`

await $`sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd`

await $`rm -f argocd-linux-amd64`

if (await (exists('~/.bashrc'))) {
  logger.info('Setup argocd autocompletion for bash')
  await appendUniqueLine(`if command -v argocd >/dev/null 2>&1; then source <(argocd completion bash); compdef _argocd argocd; fi" "$HOME/.bashrc`, '~/.bashrc')
}

if (await (exists('~/.zshrc'))) {
  logger.info('Setup argocd autocompletion for zsh')
  await appendUniqueLine(`if command -v argocd >/dev/null 2>&1; then source <(argocd completion zsh); compdef _argocd argocd; fi" "$HOME/.zshrc`, '~/.zshrc')
}
