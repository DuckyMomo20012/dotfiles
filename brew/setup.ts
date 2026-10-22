import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { appendToShellRc, bash, brewBinPath, ensureInstalled, exec, logger } from '../lib/utils'

logger.info('Setting up brew...')

await ensureInstalled('brew', async () => {
  await bash('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', {
    env: { NONINTERACTIVE: '1' },
  })
}, { paths: [brewBinPath], label: 'Homebrew' })

logger.info('Adding brew to shell config')
await appendToShellRc(`export PATH=/home/linuxbrew/.linuxbrew/bin:\$PATH`)

const brewfile = join(__dirname, 'Brewfile')
const entries = (await readFile(brewfile, 'utf8').catch(() => ''))
  .split('\n')
  .filter(line => line.trim() !== '' && !line.trim().startsWith('#'))

if (entries.length === 0) {
  logger.info('Brewfile is empty, nothing to install.')
}
else {
  logger.info('Installing brew packages from Brewfile...')
  // NOTE: `brew bundle` skips what is already installed.
  await exec([brewBinPath, 'bundle', `--file=${brewfile}`])
}
