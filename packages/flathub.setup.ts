import { $ } from 'bun'
import { logger, prettyAptInstall } from '../lib/utils'

logger.info('Installing Flatpak and Flathub...')

// NOTE: Run apt-get commands with prettyAptInstall to avoid issues with sudo
// password prompts in Bun's $ template literal.
await prettyAptInstall(`sudo apt-get update`)

await prettyAptInstall(`sudo apt-get install -y flatpak`)

await prettyAptInstall(`sudo apt-get install -y gnome-software-plugin-flatpak`)

await $`sudo flatpak remote-add --if-not-exists --system flathub https://flathub.org/repo/flathub.flatpakrepo`
