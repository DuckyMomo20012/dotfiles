import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../lib/utils'

logger.info('Setting up kubectl...')

await $`curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"`

await $`sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl`

await $`rm -f kubectl`

if (await (exists(`${process.env.HOME}/.bashrc`))) {
  logger.info('Setup kubectl autocompletion for bash')
  await appendUniqueLine(`if command -v kubectl >/dev/null 2>&1; then source <(kubectl completion bash); fi`, `${process.env.HOME}/.bashrc`)
}

if (await (exists(`${process.env.HOME}/.zshrc`))) {
  logger.info('Setup kubectl autocompletion for zsh')
  await appendUniqueLine(`if command -v kubectl >/dev/null 2>&1; then source <(kubectl completion zsh); fi`, `${process.env.HOME}/.zshrc`)
}
