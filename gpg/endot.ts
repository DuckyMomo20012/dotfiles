import type { ParseArgsOptionsConfig } from 'node:util'
import { exists, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { $ } from 'bun'
import { gpgEncrypt, logger } from '../lib/utils'

const DEFAULT_EMAIL = 'example@gmail.com'
const DEFAULT_FILENAME = 'encrypted.tar.gz.gpg'
const DEFAULT_DEST = resolve(__dirname, '../private')

const helpMessage = `
Usage: bun endot.ts [options]

Options:
  -h, --help          Show this help message and exit
  -e, --email <email>  Specify the email address for GPG key (default: ${DEFAULT_EMAIL})
  -f, --file <filename>  Specify the output encrypted filename (default: ${DEFAULT_FILENAME})
  -d, --dest <directory>  Specify the destination directory to encrypt files (default: ${DEFAULT_DEST})
`

const options = {
  help: {
    type: 'boolean',
    short: 'h',
  },
  email: {
    type: 'string',
    short: 'e',
    default: DEFAULT_EMAIL,
  },
  file: {
    type: 'string',
    short: 'f',
    default: DEFAULT_FILENAME,
  },
  dest: {
    type: 'string',
    short: 'd',
    default: DEFAULT_DEST,
  },
} as const satisfies ParseArgsOptionsConfig

const { values } = parseArgs({
  args: Bun.argv,
  options,
  strict: true,
  allowPositionals: true,
})

if (values.help) {
  console.log(helpMessage)
  process.exit(0)
}

const email = values.email || DEFAULT_EMAIL
const filename = values.file || DEFAULT_FILENAME
const dest = values.dest || DEFAULT_DEST

if (!(await exists(dest))) {
  logger.error(`Destination directory ${dest} does not exist.`)
  process.exit(1)
}

if (!filename.endsWith('.tar.gz.gpg')) {
  logger.error(`Filename ${filename} must end with ".tar.gz.gpg".`)
  process.exit(1)
}

// NOTE: Compress the files in the destination directory before encrypting them.
// This is to filter out markdown files and files starting with "!" in the
// destination directory, and to ensure that sensitive information is not
// exposed in plaintext.
const encryptedFile = join(resolve(__dirname, '../private'), filename)
const tempDir = await mkdtemp(join(tmpdir(), 'endot-'))
const tarFile = join(tempDir, filename.replace(/\.gpg$/, ''))
const tarFileName = basename(tarFile)

try {
  await $`tar --exclude=${tarFileName} --exclude="*.md" --exclude="!*" --exclude="*gpg" -czf ${tarFile} -C ${dest} .`
  await gpgEncrypt(email, encryptedFile, tarFile)
}
catch (err) {
  // eslint-disable-next-line ts/restrict-template-expressions
  logger.error(`Failed to compress or encrypt files in ${dest}: ${err}`)
  process.exit(1)
}
finally {
  logger.info(`Deleting temporary tar file ${tarFile}...`)
  await rm(tempDir, { recursive: true, force: true })
}
