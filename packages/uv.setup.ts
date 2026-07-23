import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../lib/utils'

logger.info('Installing uv...')

await $`curl -LsSf https://astral.sh/uv/install.sh | sh`

if (await (exists(`${process.env.HOME}/.bashrc`))) {
  logger.info('Setup uv autocompletion for bash')
  await appendUniqueLine(`if command -v uv >/dev/null 2>&1; then source <(eval "$(uv generate-shell-completion bash)"); fi`, `${process.env.HOME}/.bashrc`)

  logger.info('Setup uvx autocompletion for bash')
  await appendUniqueLine(`if command -v uvx >/dev/null 2>&1; then source <(eval "$(uvx --generate-shell-completion bash)"); fi`, `${process.env.HOME}/.bashrc`)
}

if (await (exists(`${process.env.HOME}/.zshrc`))) {
  logger.info('Setup uv autocompletion for zsh')
  await appendUniqueLine(`if command -v uv >/dev/null 2>&1; then source <(eval "$(uv generate-shell-completion zsh)"); fi`, `${process.env.HOME}/.zshrc`)

  logger.info('Setup uvx autocompletion for zsh')
  await appendUniqueLine(`if command -v uvx >/dev/null 2>&1; then source <(eval "$(uvx --generate-shell-completion zsh)"); fi`, `${process.env.HOME}/.zshrc`)
}
