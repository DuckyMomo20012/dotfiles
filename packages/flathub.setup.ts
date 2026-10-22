import { aptInstall, aptUpdate, exec, logger } from '../lib/utils'

logger.info('Installing Flatpak and Flathub...')

await aptUpdate()

await aptInstall(['flatpak', 'gnome-software-plugin-flatpak'])

// NOTE: `--if-not-exists` makes this safe to repeat.
await exec(['sudo', 'flatpak', 'remote-add', '--if-not-exists', '--system', 'flathub', 'https://flathub.org/repo/flathub.flatpakrepo'])
