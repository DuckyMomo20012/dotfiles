import { exists } from 'node:fs/promises'
import process from 'node:process'
import { $ } from 'bun'
import { appendUniqueLine, logger, prettyAptInstall } from '../lib/utils'

logger.info('Setting up terraform...')

// NOTE: Run apt-get commands with prettyAptInstall to avoid issues with sudo
// password prompts in Bun's $ template literal.
await prettyAptInstall(`sudo apt-get update`)

await prettyAptInstall(`sudo apt-get install -y gnupg software-properties-common`)

await $`wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null`

// Detect system architecture & codename
const arch = (await $`dpkg --print-architecture`.text()).trim()
const rawCodename = (await $`grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs`.text()).trim()

// Check if HashiCorp supports the codename (HTTP 200)
async function checkRepo(code: string) {
  try {
    const res = await fetch(
      `https://apt.releases.hashicorp.com/dists/${code}/main/binary-${arch}/Packages`,
      { headers: { Range: 'bytes=0-500' } }, // Fetch only the header of the file
    )
    const text = await res.text()
    return text.includes('Package: terraform')
  }
  catch {
    return false
  }
}

// Use system codename if supported, otherwise fall back to 'noble' (Ubuntu 24.04 LTS)
const targetCodename = (await checkRepo(rawCodename)) ? rawCodename : 'noble'

await $`echo "deb [arch=${arch} signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com ${targetCodename} main" | sudo tee /etc/apt/sources.list.d/hashicorp.list`

await prettyAptInstall(`sudo apt-get update`)

await prettyAptInstall(`sudo apt-get install -y terraform`)

if (await (exists(`${process.env.HOME}/.bashrc`))) {
  logger.info('Setup terraform autocompletion for bash')
  await appendUniqueLine(`if command -v terraform >/dev/null 2>&1; then source <(complete -o nospace -C $(which terraform) terraform); fi`, `${process.env.HOME}/.bashrc`)
}

if (await (exists(`${process.env.HOME}/.zshrc`))) {
  logger.info('Setup terraform autocompletion for zsh')
  await appendUniqueLine(`if command -v terraform >/dev/null 2>&1; then source <(complete -o nospace -C $(which terraform) terraform); fi`, `${process.env.HOME}/.zshrc`)
}
