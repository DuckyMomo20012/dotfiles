import { userInfo } from 'node:os'
import process from 'node:process'
import { aptInstall, aptRemove, aptUpdate, capture, config, ensureAptRepo, exec, getArch, getCodename, isPackageInstalled, logger, readOsRelease } from '../lib/utils'

logger.info('Setting up docker...')

if (await isPackageInstalled('docker-ce') && !config.force) {
  logger.info('docker-ce is already installed, skipping (use --force to reinstall).')
}
else {
  // NOTE: Uninstall old versions. Only the ones that are installed are removed,
  // so this is a no-op on a clean machine and on every re-run.
  await aptRemove(['docker.io', 'docker-doc', 'docker-compose', 'docker-compose-v2', 'podman-docker', 'containerd', 'runc'])

  await aptInstall(['ca-certificates', 'curl'])

  // NOTE: Ubuntu derivatives (Mint, Pop!_OS...) report their own codename in
  // `lsb_release`, `/etc/os-release` knows the Ubuntu one.
  const os = await readOsRelease()
  const distro = os.ID === 'debian' ? 'debian' : 'ubuntu'
  const codename = await getCodename()

  const repoChanged = await ensureAptRepo({
    keyUrl: `https://download.docker.com/linux/${distro}/gpg`,
    keyPath: '/etc/apt/keyrings/docker.asc',
    listPath: '/etc/apt/sources.list.d/docker.list',
    listLine: `deb [arch=${getArch()} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${distro} ${codename} stable`,
  })

  await aptUpdate({ maxAgeMinutes: repoChanged ? 0 : 60 })

  await aptInstall(['docker-ce', 'docker-ce-cli', 'containerd.io', 'docker-buildx-plugin', 'docker-compose-plugin'])
}

const user = process.env.USER ?? userInfo().username
const groups = (await capture(['id', '-nG', user]))?.split(/\s+/) ?? []

if (groups.includes('docker')) {
  logger.info(`User ${user} is already in the docker group.`)
}
else {
  logger.info(`Adding user ${user} to docker group`)
  await exec(['sudo', 'usermod', '-aG', 'docker', user])
}
