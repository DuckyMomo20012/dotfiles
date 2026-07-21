import { exists } from 'node:fs/promises'
import { $ } from 'bun'
import { appendUniqueLine, logger, prettyAptInstall } from '../scripts/utils'

logger.info('Setting up terraform...')

// NOTE: Run apt-get commands with prettyAptInstall to avoid issues with sudo
// password prompts in Bun's $ template literal.
await prettyAptInstall(`sudo apt-get update`)

await prettyAptInstall(`sudo apt-get install -y gnupg software-properties-common`)

await $`wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg`

await $`echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list`

await prettyAptInstall(`sudo apt-get update`)

await prettyAptInstall(`sudo apt-get install -y terraform`)

if (await (exists('~/.bashrc'))) {
  logger.info('Setup terraform autocompletion for bash')
  await appendUniqueLine(`if command -v terraform >/dev/null 2>&1; then source <(complete -o nospace -C $(which terraform) terraform); fi" "$HOME/.bashrc`, '~/.bashrc')
}

if (await (exists('~/.zshrc'))) {
  logger.info('Setup terraform autocompletion for zsh')
  await appendUniqueLine(`if command -v terraform >/dev/null 2>&1; then source <(complete -o nospace -C $(which terraform) terraform); fi" "$HOME/.zshrc`, '~/.zshrc')
}
