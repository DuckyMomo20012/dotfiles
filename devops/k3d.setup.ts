import { exists } from 'node:fs/promises'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../scripts/utils'

logger.info('Setting up k3d...')

await $`curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash`

if (await (exists('~/.bashrc'))) {
  logger.info('Setup k3d autocompletion for bash')
  await appendUniqueLine(`if command -v k3d >/dev/null 2>&1; then source <(k3d completion bash); fi" "$HOME/.bashrc`, '~/.bashrc')
}

if (await (exists('~/.zshrc'))) {
  logger.info('Setup k3d autocompletion for zsh')
  await appendUniqueLine(`if command -v k3d >/dev/null 2>&1; then source <(k3d completion zsh); fi" "$HOME/.zshrc`, '~/.zshrc')
}
