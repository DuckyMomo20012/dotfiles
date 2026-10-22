import { join } from 'node:path'
import { appendToShellRc, asdfBinPath, download, ensureInstalled, getArch, githubLatestAsset, installBinaryFromTarGz, logger, withTempDir } from '../lib/utils'

logger.info('Setting up asdf...')

await ensureInstalled('asdf', async () => {
  const arch = getArch()
  const asset = await githubLatestAsset('asdf-vm/asdf', name => name.includes(`linux-${arch}.tar.gz`))

  await withTempDir(async (dir) => {
    const archive = join(dir, 'asdf.tar.gz')
    await download(asset.url, archive)
    await installBinaryFromTarGz(archive, 'asdf', asdfBinPath)
  })

  logger.success(`Installed asdf ${asset.tag}`)
}, { paths: [asdfBinPath] })

// NOTE: Add asdf to the shell configuration file
logger.info('Adding asdf to shell config')
await appendToShellRc(shell => [
  `export PATH=\$HOME/.asdf/bin:\$PATH`,
  `export PATH=\${ASDF_DATA_DIR:-\$HOME/.asdf}/shims:\$PATH`,
  `if command -v asdf >/dev/null 2>&1; then source <(asdf completion ${shell}); fi`,
])
