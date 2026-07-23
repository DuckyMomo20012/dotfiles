import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { appendUniqueLine, logger, prettyAptInstall } from '../lib/utils'

logger.info('Installing lotus...')

await $`sudo mkdir -p /etc/apt/keyrings`

await $`curl -fsSL https://fcitx5-lotus.pages.dev/pubkey.gpg | sudo gpg --dearmor | sudo tee /etc/apt/keyrings/fcitx5-lotus.gpg > /dev/null`

await $`export CODENAME=$(grep '^UBUNTU_CODENAME=' /etc/os-release | cut -d'=' -f2) && echo "deb [signed-by=/etc/apt/keyrings/fcitx5-lotus.gpg] https://fcitx5-lotus.pages.dev/apt/$CODENAME $CODENAME main" | sudo tee /etc/apt/sources.list.d/fcitx5-lotus.list`

await prettyAptInstall(`sudo apt-get update`)

await prettyAptInstall(`sudo apt-get install -y fcitx5-lotus`)

if (await (exists(`${process.env.HOME}/.bashrc`))) {
  logger.info('Setup lotus environment variables for bash')
  await appendUniqueLine(`export XMODIFIERS=@im=fcitx`, `${process.env.HOME}/.bash_profile`)

  await appendUniqueLine(`export QT_IM_MODULE=fcitx`, `${process.env.HOME}/.bash_profile`)

  await appendUniqueLine(`export QT_IM_MODULES="wayland;fcitx"`, `${process.env.HOME}/.bash_profile`)

  await appendUniqueLine(`export GLFW_IM_MODULE=ibus`, `${process.env.HOME}/.bash_profile`)
}

if (await (exists(`${process.env.HOME}/.zshrc`))) {
  logger.info('Setup lotus environment variables for zsh')
  await appendUniqueLine(`export XMODIFIERS=@im=fcitx`, `${process.env.HOME}/.zprofile`)

  await appendUniqueLine(`export QT_IM_MODULE=fcitx`, `${process.env.HOME}/.zprofile`)

  await appendUniqueLine(`export QT_IM_MODULES="wayland;fcitx"`, `${process.env.HOME}/.zprofile`)

  await appendUniqueLine(`export GLFW_IM_MODULE=ibus`, `${process.env.HOME}/.zprofile`)
}
