import { appendToShellRc, aptInstall, aptUpdate, config, ensureAptRepo, getCodename, isPackageInstalled, logger } from '../lib/utils'

logger.info('Installing lotus...')

if (await isPackageInstalled('fcitx5-lotus') && !config.force) {
  logger.info('fcitx5-lotus is already installed, skipping (use --force to reinstall).')
}
else {
  const codename = await getCodename()

  const repoChanged = await ensureAptRepo({
    keyUrl: 'https://fcitx5-lotus.pages.dev/pubkey.gpg',
    keyPath: '/etc/apt/keyrings/fcitx5-lotus.gpg',
    dearmor: true,
    listPath: '/etc/apt/sources.list.d/fcitx5-lotus.list',
    listLine: `deb [signed-by=/etc/apt/keyrings/fcitx5-lotus.gpg] https://fcitx5-lotus.pages.dev/apt/${codename} ${codename} main`,
  })

  await aptUpdate({ maxAgeMinutes: repoChanged ? 0 : 60 })

  await aptInstall(['fcitx5-lotus'])
}

logger.info('Setup lotus environment variables')
await appendToShellRc([
  `export XMODIFIERS=@im=fcitx`,
  `export QT_IM_MODULE=fcitx`,
  `export QT_IM_MODULES="wayland;fcitx"`,
  `export GLFW_IM_MODULE=ibus`,
], { files: { bash: '.bash_profile', zsh: '.zprofile' } })
