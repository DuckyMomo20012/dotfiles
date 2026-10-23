import { appendToShellRc, aptInstall, aptUpdate, config, ensureAptRepo, getArch, getCodename, isPackageInstalled, logger, pathExists } from '../lib/utils'

logger.info('Setting up terraform...')

const LIST_PATH = '/etc/apt/sources.list.d/hashicorp.list'

if (await isPackageInstalled('terraform') && !config.force) {
  logger.info('terraform is already installed, skipping (use --force to reinstall).')
}
else {
  await aptUpdate()

  await aptInstall(['gnupg', 'software-properties-common'])

  // Detect system architecture & codename
  const arch = getArch()
  const rawCodename = await getCodename()

  // Check if HashiCorp supports the codename.
  // Returns `undefined` when the check itself failed (e.g. offline).
  async function checkRepo(code: string): Promise<boolean | undefined> {
    try {
      const res = await fetch(
        `https://apt.releases.hashicorp.com/dists/${code}/main/binary-${arch}/Packages`,
        { headers: { Range: 'bytes=0-500' } }, // Fetch only the header of the file
      )
      if (!res.ok && res.status !== 206)
        return false
      return (await res.text()).includes('Package: terraform')
    }
    catch {
      return undefined
    }
  }

  // Use system codename if supported, otherwise fall back to 'noble' (Ubuntu 24.04 LTS)
  const supported = config.dryRun ? true : await checkRepo(rawCodename)
  let targetCodename = supported ? rawCodename : 'noble'

  if (supported === undefined && await pathExists(LIST_PATH)) {
    logger.warn('Could not reach apt.releases.hashicorp.com, keeping the existing repository file.')
    targetCodename = ''
  }

  if (targetCodename !== '') {
    const keyring = '/usr/share/keyrings/hashicorp-archive-keyring.gpg'
    const repoChanged = await ensureAptRepo({
      keyUrl: 'https://apt.releases.hashicorp.com/gpg',
      keyPath: keyring,
      dearmor: true,
      listPath: LIST_PATH,
      listLine: `deb [arch=${arch} signed-by=${keyring}] https://apt.releases.hashicorp.com ${targetCodename} main`,
    })

    await aptUpdate({ maxAgeMinutes: repoChanged ? 0 : 60 })
  }

  await aptInstall(['terraform'])
}

logger.info('Setup terraform autocompletion')
await appendToShellRc(`if command -v terraform >/dev/null 2>&1; then source <(complete -o nospace -C $(which terraform) terraform); fi`)
