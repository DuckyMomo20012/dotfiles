import { logger, prettyAptInstall } from '../scripts/utils'

logger.info('Installing APT packages...')

const packages = [
  'git',
  'curl',
  'make',
  'build-essential',
  'npm',
  'gnupg',
  // For poetry
  'python3-venv',
  // My Internet driver
  '!r8168-dkms',
  // Sound settings
  '!pavucontrol',
  // To fix my front jack problem
  '!alsa-tools-gui',
  // Extension manager
  'gnome-shell-extension-manager',
].filter(pkg => !pkg.startsWith('!'))

// NOTE: Run apt-get commands with prettyAptInstall to avoid issues with sudo
// password prompts in Bun's $ template literal.
await prettyAptInstall(`sudo apt-get update`)

await prettyAptInstall(`sudo apt-get install -y ${packages.join(' ')}`)
