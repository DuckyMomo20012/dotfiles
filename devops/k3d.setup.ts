import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../lib/utils'

logger.info('Setting up k3d...')

await $`curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash`

if (await (exists(`${process.env.HOME}/.bashrc`))) {
  logger.info('Setup k3d autocompletion for bash')
  await appendUniqueLine(`if command -v k3d >/dev/null 2>&1; then source <(k3d completion bash); fi`, `${process.env.HOME}/.bashrc`)
}

if (await (exists(`${process.env.HOME}/.zshrc`))) {
  logger.info('Setup k3d autocompletion for zsh')
  await appendUniqueLine(`if command -v k3d >/dev/null 2>&1; then source <(k3d completion zsh); fi`, `${process.env.HOME}/.zshrc`)
}
