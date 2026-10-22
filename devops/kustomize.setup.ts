import { join } from 'node:path'
import { appendToShellRc, bash, cobraCompletion, ensureInstalled, exec, logger, withTempDir } from '../lib/utils'

logger.info('Setting up kustomize...')

await ensureInstalled('kustomize', async () => {
  // NOTE: The installer drops a `kustomize` binary into the current directory,
  // so run it in a temp directory instead of polluting the repository.
  await withTempDir(async (dir) => {
    await bash('curl -fsSL "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash', { cwd: dir })

    await exec(['sudo', 'install', '-m', '0755', join(dir, 'kustomize'), '/usr/local/bin/kustomize'])
  })
})

logger.info('Setup kustomize autocompletion')
await appendToShellRc(cobraCompletion('kustomize'))
