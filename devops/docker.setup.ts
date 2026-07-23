import process from 'node:process'
import { $ } from 'bun'
import { logger, prettyAptInstall } from '../lib/utils'

logger.info('Setting up docker...')

// NOTE: Uninstall old versions
await prettyAptInstall(`sudo apt-get remove -y docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc`)

// NOTE: Run apt-get commands with prettyAptInstall to avoid issues with sudo
// password prompts in Bun's $ template literal.
await prettyAptInstall(`sudo apt-get update`)

await prettyAptInstall(`sudo apt-get install -y ca-certificates curl`)

await $`sudo install -m 0755 -d /etc/apt/keyrings`

await $`curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null`

await $`sudo chmod a+r /etc/apt/keyrings/docker.asc`

await $`echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`

await prettyAptInstall(`sudo apt-get update`)

await prettyAptInstall(`sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`)

if (process.env.USER !== undefined) {
  logger.info(`Adding user ${process.env.USER} to docker group`)
  await $`sudo usermod -aG docker ${process.env.USER}`
}
