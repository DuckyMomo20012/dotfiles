import { exists } from 'node:fs/promises'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../scripts/utils'

logger.info('Installing uv...')

await $`curl -LsSf https://astral.sh/uv/install.sh | sh`

if (await (exists('~/.bashrc'))) {
  logger.info('Setup uv autocompletion for bash')
  await appendUniqueLine(`if command -v uv >/dev/null 2>&1; then source <(eval "$(uv generate-shell-completion bash)"); fi`, '~/.bashrc')

  logger.info('Setup uvx autocompletion for bash')
  await appendUniqueLine(`if command -v uvx >/dev/null 2>&1; then source <(eval "$(uvx --generate-shell-completion bash)"); fi`, '~/.bashrc')
}

if (await (exists('~/.zshrc'))) {
  logger.info('Setup uv autocompletion for zsh')
  await appendUniqueLine(`if command -v uv >/dev/null 2>&1; then source <(eval "$(uv generate-shell-completion zsh)"); fi`, '~/.zshrc')

  logger.info('Setup uvx autocompletion for zsh')
  await appendUniqueLine(`if command -v uvx >/dev/null 2>&1; then source <(eval "$(uvx --generate-shell-completion zsh)"); fi`, '~/.zshrc')
}
