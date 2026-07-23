import { logger, prettyAptInstall } from '../lib/utils'

logger.info('Installing Fuse...')

// NOTE: Setup for AppImage
// Ref: https://github.com/AppImage/AppImageKit/wiki/FUSE

// NOTE: Run apt-get commands with prettyAptInstall to avoid issues with sudo
// password prompts in Bun's $ template literal.
await prettyAptInstall(`sudo add-apt-repository universe -y`)

await prettyAptInstall(`sudo apt-get update`)

await prettyAptInstall(`sudo apt-get install -y libfuse2`)
