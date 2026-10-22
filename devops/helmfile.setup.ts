import { join } from 'node:path'
import { appendToShellRc, cobraCompletion, download, ensureInstalled, getArch, getHome, githubLatestAsset, installBinaryFromTarGz, logger, withTempDir } from '../lib/utils'

logger.info('Setting up helmfile...')

const binPath = join(getHome(), '.local', 'bin', 'helmfile')

await ensureInstalled('helmfile', async () => {
  const arch = getArch()
  const asset = await githubLatestAsset('helmfile/helmfile', name => name.endsWith(`linux_${arch}.tar.gz`))

  await withTempDir(async (dir) => {
    const archive = join(dir, 'helmfile.tar.gz')
    await download(asset.url, archive)
    // NOTE: Only the binary is installed; the archive also holds LICENSE/README.
    await installBinaryFromTarGz(archive, 'helmfile', binPath)
  })

  logger.success(`Installed helmfile ${asset.tag}`)
}, { paths: [binPath] })

logger.info('Setup helmfile autocompletion')
await appendToShellRc(cobraCompletion('helmfile'))
