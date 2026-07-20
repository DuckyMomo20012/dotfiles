import type { ParseArgsOptionsConfig } from 'node:util'
import { exists, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { gpgDecrypt, logger } from '../scripts/utils'

const DEFAULT_FILENAME = join(resolve(__dirname, '../private'), 'encrypted.tar.gz.gpg')
const DEFAULT_DEST = resolve(__dirname, '../private')

const helpMessage = `
Usage: bun dedot.ts [options]

Options:
  -h, --help          Show this help message and exit
  -f, --file <filename>  Specify the filename to decrypt (default: ${DEFAULT_FILENAME})
  -d, --dest <directory>  Specify the destination directory for decrypted files (default: ${DEFAULT_DEST})
  -p, --passphrase <passphrase>  Specify the passphrase for decryption (default: from environment variable GPG_PASSPHRASE)
`

const options = {
  help: {
    type: 'boolean',
    short: 'h',
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
  passphrase: {
    type: 'string',
    short: 'p',
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

const filename = values.file || DEFAULT_FILENAME
const dest = values.dest || DEFAULT_DEST
const passphrase = values.passphrase ?? process.env.GPG_PASSPHRASE

if (!(await exists(dest))) {
  mkdir(dest, { recursive: true }).catch((err) => {
    logger.error(`Failed to create destination directory ${dest}: ${err}`)
    process.exit(1)
  })
}

await gpgDecrypt(filename, dest, passphrase)
