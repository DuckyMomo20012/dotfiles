import { userInfo } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { aptInstall, bash, capture, config, exec, getHome, gitCloneOrUpdate, logger, pathExists } from '../lib/utils'

logger.info('Installing zsh...')

await aptInstall(['zsh'])

logger.info('Changing default shell to zsh...')
// NOTE: In dry-run zsh may not be installed yet, so fall back to the usual path.
const zshPath = Bun.which('zsh') ?? (config.dryRun ? '/usr/bin/zsh' : null)
if (zshPath === null) {
  logger.error('Failed to find zsh path.')
  process.exit(1)
}

const user = process.env.USER ?? userInfo().username
const currentShell = (await capture(['getent', 'passwd', user]))?.split(':').pop()

if (currentShell?.endsWith('/zsh')) {
  logger.info(`The login shell of ${user} is already zsh.`)
}
else {
  await exec(['sudo', 'chsh', '-s', zshPath, user])
}

logger.info('Installing oh-my-zsh...')
const home = getHome()
const ohMyZshDir = join(home, '.oh-my-zsh')
if (!(await pathExists(ohMyZshDir))) {
  // NOTE: Keep an existing ~/.zshrc (it is usually our symlink) instead of
  // letting the installer replace it with its template.
  const keepZshrc = (await pathExists(join(home, '.zshrc'))) ? 'yes' : 'no'
  await bash('sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended', {
    env: { KEEP_ZSHRC: keepZshrc },
  })
}
else {
  logger.info('oh-my-zsh is already installed.')
}

// NOTE: Existing clones are fast-forwarded instead of being deleted and
// cloned again, so a re-run is quick, works offline, and can never leave you
// without a theme or plugin when the network fails half way.
const custom = join(ohMyZshDir, 'custom')

logger.info('Installing powerlevel10k theme...')
await gitCloneOrUpdate('https://github.com/romkatv/powerlevel10k.git', join(custom, 'themes', 'powerlevel10k'))

const plugins = [
  ['zsh-autosuggestions', 'https://github.com/zsh-users/zsh-autosuggestions'],
  ['zsh-autocomplete', 'https://github.com/marlonrichert/zsh-autocomplete.git'],
  ['zsh-syntax-highlighting', 'https://github.com/zsh-users/zsh-syntax-highlighting.git'],
] as const

for (const [name, url] of plugins) {
  logger.info(`Installing ${name} plugin...`)
  await gitCloneOrUpdate(url, join(custom, 'plugins', name))
}
