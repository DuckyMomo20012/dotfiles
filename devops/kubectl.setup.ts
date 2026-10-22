import { join } from 'node:path'
import { appendToShellRc, cobraCompletion, config, download, ensureInstalled, exec, fetchText, getArch, logger, verifySha256, withTempDir } from '../lib/utils'

logger.info('Setting up kubectl...')

await ensureInstalled('kubectl', async () => {
  const arch = getArch()
  const version = config.dryRun ? 'stable' : await fetchText('https://dl.k8s.io/release/stable.txt')
  const url = `https://dl.k8s.io/release/${version}/bin/linux/${arch}/kubectl`

  await withTempDir(async (dir) => {
    const file = join(dir, 'kubectl')
    await download(url, file)

    if (!config.dryRun)
      await verifySha256(file, (await fetchText(`${url}.sha256`)).split(/\s+/)[0] ?? '')

    await exec(['sudo', 'install', '-o', 'root', '-g', 'root', '-m', '0755', file, '/usr/local/bin/kubectl'])
  })
})

logger.info('Setup kubectl autocompletion')
await appendToShellRc(cobraCompletion('kubectl'))
