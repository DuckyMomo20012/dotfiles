import type { ParseArgsOptionsConfig } from 'node:util'
import { exists } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { $ } from 'bun'
import { gpgEncrypt, logger } from '../scripts/utils'

const DEFAULT_EMAIL = 'example@gmail.com'
const DEFAULT_FILENAME = join(resolve(__dirname, '../private'), 'encrypted.tar.gz.gpg')
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

// NOTE: Compress the files in the destination directory before encrypting them.
// This is to filter out markdown files and files starting with "!" in the
// destination directory, and to ensure that sensitive information is not
// exposed in plaintext.
$`tar --exclude=${filename} --exclude="*.md" --exclude="!*" --exclude="*gpg" -czf ${filename} -C ${dest} .`.catch(
  (err) => {
    logger.error(`Failed to compress files in ${dest}: ${err}`)
    process.exit(1)
  },
)

await gpgEncrypt(email, filename, dest)
