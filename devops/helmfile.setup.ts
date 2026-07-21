import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../scripts/utils'

logger.info('Setting up helmfile...')

const releases = await (await fetch('https://api.github.com/repos/helmfile/helmfile/releases/latest')).json()
// @ts-expect-error - TypeScript is not aware of the structure of the GitHub API
// response, so we use 'any' type here.
// eslint-disable-next-line ts/no-unsafe-call, ts/no-unsafe-member-access, ts/no-unsafe-return
const downloadUrl = releases?.assets.find((asset: any) => asset?.browser_download_url?.includes('linux-amd64.tar.gz'))?.browser_download_url as string

if (!downloadUrl) {
  logger.error('Failed to find the download URL for the latest asdf release.')
  process.exit(1)
}

await $`curl -L ${downloadUrl} | tar xz -C ~/.local/bin`

if (await (exists('~/.bashrc'))) {
  logger.info('Setup helmfile autocompletion for bash')
  await appendUniqueLine(`if command -v helmfile >/dev/null 2>&1; then source <(helmfile completion bash); fi" "$HOME/.bashrc`, '~/.bashrc')
}

if (await (exists('~/.zshrc'))) {
  logger.info('Setup helmfile autocompletion for zsh')
  await appendUniqueLine(`if command -v helmfile >/dev/null 2>&1; then source <(helmfile completion zsh); fi" "$HOME/.zshrc`, '~/.zshrc')
}
