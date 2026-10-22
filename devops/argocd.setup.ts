import { join } from 'node:path'
import { appendToShellRc, cobraCompletion, config, download, ensureInstalled, exec, fetchText, getArch, logger, verifySha256, withTempDir } from '../lib/utils'

logger.info('Setting up ArgoCD...')

await ensureInstalled('argocd', async () => {
  const arch = getArch()
  const base = 'https://github.com/argoproj/argo-cd/releases/latest/download'
  const name = `argocd-linux-${arch}`

  await withTempDir(async (dir) => {
    const file = join(dir, name)
    await download(`${base}/${name}`, file)

    if (!config.dryRun) {
      // NOTE: ArgoCD publishes `<sha256>  <asset>` lines for every binary.
      const checksums = await fetchText(`${base}/cli_checksums.txt`)
      const expected = checksums.split('\n').find(line => line.trim().endsWith(name))?.trim().split(/\s+/)[0]
      if (expected)
        await verifySha256(file, expected)
    }

    await exec(['sudo', 'install', '-m', '555', file, '/usr/local/bin/argocd'])
  })
})

logger.info('Setup argocd autocompletion')
await appendToShellRc(cobraCompletion('argocd', ' compdef _argocd argocd;'))
