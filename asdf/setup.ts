import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { appendUniqueLine, logger } from '../scripts/utils'

logger.info('Setting up asdf...')

const releases = await (await fetch('https://api.github.com/repos/asdf-vm/asdf/releases/latest')).json()
// @ts-expect-error - TypeScript is not aware of the structure of the GitHub API
// response, so we use 'any' type here.
// eslint-disable-next-line ts/no-unsafe-call, ts/no-unsafe-member-access, ts/no-unsafe-return
const downloadUrl = releases?.assets.find((asset: any) => asset?.browser_download_url?.includes('linux-amd64.tar.gz'))?.browser_download_url as string

if (!downloadUrl) {
  logger.error('Failed to find the download URL for the latest asdf release.')
  process.exit(1)
}

await $`mkdir -p ~/.asdf/bin`

await $`curl -L ${downloadUrl} | tar xz -C ~/.asdf/bin`

// NOTE: Add asdf to the shell configuration file
if (await (exists('~/.bashrc'))) {
  logger.info('Adding asdf to ~/.bashrc')
  await appendUniqueLine(`export PATH=\$HOME/.asdf/bin:\$PATH" "$HOME/.bashrc"`, '~/.bashrc')
  await appendUniqueLine(`export PATH=\${ASDF_DATA_DIR:-\$HOME/.asdf}/shims:\$PATH`, '~/.bashrc')

  logger.info('Setup asdf autocompletion for bash')
  await appendUniqueLine(`if command -v asdf >/dev/null 2>&1; then source <(asdf completion bash); fi`, '~/.bashrc')
}

if (await (exists('~/.zshrc'))) {
  logger.info('Adding asdf to ~/.zshrc')
  await appendUniqueLine(`export PATH=\$HOME/.asdf/bin:\$PATH" "$HOME/.zshrc"`, '~/.zshrc')
  await appendUniqueLine(`export PATH=\${ASDF_DATA_DIR:-\$HOME/.asdf}/shims:\$PATH`, '~/.zshrc')

  logger.info('Setup asdf autocompletion for zsh')
  await appendUniqueLine(`if command -v asdf >/dev/null 2>&1; then source <(asdf completion zsh); fi`, '~/.zshrc')
}
