import { aptInstall, aptUpdate, logger } from '../lib/utils'

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

// NOTE: `aptUpdate` skips the update when the package lists are fresh, and
// `aptInstall` only installs what is missing, so re-running is cheap.
await aptUpdate()

await aptInstall(packages)
