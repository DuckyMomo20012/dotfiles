import type { ParseArgsOptionsConfig } from 'node:util'
import { access } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { exec, gpgEncrypt, logger, withTempDir } from '../lib/utils'

const DEFAULT_EMAIL = 'example@gmail.com'
const DEFAULT_FILENAME = 'encrypted.tar.gz.gpg'
const DEFAULT_DEST = resolve(__dirname, '../private')

const helpMessage = `
Usage: bun endot.ts [options]

Options:
  -h, --help          Show this help message and exit
  -e, --email <email>  Specify the email address for GPG key (default: $GPG_EMAIL, then ${DEFAULT_EMAIL})
  -f, --file <filename>  Specify the output encrypted filename (default: ${DEFAULT_FILENAME})
  -d, --dest <directory>  Specify the destination directory to encrypt files (default: ${DEFAULT_DEST})
  -n, --dry-run       Show what would change, change nothing
`

const options = {
  'help': {
    type: 'boolean',
    short: 'h',
  },
  'email': {
    type: 'string',
    short: 'e',
  },
  'file': {
    type: 'string',
    short: 'f',
    default: DEFAULT_FILENAME,
  },
  'dest': {
    type: 'string',
    short: 'd',
    default: DEFAULT_DEST,
  },
  'dry-run': {
    type: 'boolean',
    short: 'n',
  },
} as const satisfies ParseArgsOptionsConfig

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options,
  strict: true,
  allowPositionals: true,
})

if (values.help) {
  console.log(helpMessage)
  process.exit(0)
}

if (values['dry-run'])
  process.env.DOTFILES_DRY_RUN = '1'

const email = values.email || process.env.GPG_EMAIL || DEFAULT_EMAIL
const filename = values.file || DEFAULT_FILENAME
const dest = values.dest || DEFAULT_DEST

await access(dest).catch(() => {
  logger.error(`Destination directory ${dest} does not exist.`)
  process.exit(1)
})

if (!filename.endsWith('.tar.gz.gpg')) {
  logger.error(`Filename ${filename} must end with ".tar.gz.gpg".`)
  process.exit(1)
}

// NOTE: Compress the files in the destination directory before encrypting them.
// This is to filter out markdown files and files starting with "!" in the
// destination directory, and to ensure that sensitive information is not
// exposed in plaintext. The encrypted file is written to the private directory.
const encryptedFile = join(resolve(__dirname, '../private'), filename)

await withTempDir(async (tempDir) => {
  const tarFile = join(tempDir, filename.replace(/\.gpg$/, ''))
  const tarFileName = basename(tarFile)

  // NOTE: Building the tarball only writes inside the temp directory, so it is
  // safe to do even in dry-run.
  await exec(['tar', `--exclude=${tarFileName}`, '--exclude=*.md', '--exclude=!*', '--exclude=*gpg', '--exclude=*.backup*', '-czf', tarFile, '-C', dest, '.'], { readOnly: true })
  await gpgEncrypt(email, encryptedFile, tarFile)

  logger.info(`Deleting temporary tar file ${tarFile}...`)
}, 'endot-')
