import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../lib/utils'

logger.info('Setting up ArgoCD...')

await $`curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64`

await $`sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd`

await $`rm -f argocd-linux-amd64`

if (await (exists(`${process.env.HOME}/.bashrc`))) {
  logger.info('Setup argocd autocompletion for bash')
  await appendUniqueLine(`if command -v argocd >/dev/null 2>&1; then source <(argocd completion bash); compdef _argocd argocd; fi`, `${process.env.HOME}/.bashrc`)
}

if (await (exists(`${process.env.HOME}/.zshrc`))) {
  logger.info('Setup argocd autocompletion for zsh')
  await appendUniqueLine(`if command -v argocd >/dev/null 2>&1; then source <(argocd completion zsh); compdef _argocd argocd; fi`, `${process.env.HOME}/.zshrc`)
}
