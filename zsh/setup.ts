import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { logger, prettyAptInstall } from '../scripts/utils'

logger.info('Installing zsh...')

// NOTE: Run apt-get commands with prettyAptInstall to avoid issues with sudo
// password prompts in Bun's $ template literal.
await prettyAptInstall(`sudo apt-get install -y zsh`)

logger.info('Changing default shell to zsh...')
const zshPath = await $`which zsh`
if (zshPath.exitCode !== 0) {
  logger.error('Failed to find zsh path.')
  process.exit(1)
}

await $`sudo chsh -s ${zshPath.text().trim()} $USER`

logger.info('Installing oh-my-zsh...')
const ohMyZshDir = `${process.env.HOME}/.oh-my-zsh`
if (!(await exists(ohMyZshDir))) {
  await $`sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended`
}
else {
  logger.info('oh-my-zsh is already installed.')
}

logger.info('Installing powerlevel10k theme...')
await $`git clone --depth 1 https://github.com/romkatv/powerlevel10k.git $HOME/.oh-my-zsh/custom/themes/powerlevel10k`

logger.info('Installing zsh-autosuggestions plugin...')
await $`git clone --depth 1 https://github.com/zsh-users/zsh-autosuggestions $HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions`

logger.info('Installing zsh-autocomplete plugin...')
await $`git clone --depth 1 "https://github.com/marlonrichert/zsh-autocomplete.git" $HOME/.oh-my-zsh/custom/plugins/zsh-autocomplete`

logger.info('Installing zsh-syntax-highlighting plugin...')
await $`git clone --depth 1 "https://github.com/zsh-users/zsh-syntax-highlighting.git" $HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting`
