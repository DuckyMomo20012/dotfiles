import type { ParseArgsOptionsConfig } from 'node:util'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { applyCommonOptions, commonHelp, commonOptions, gpgDecryptArchive, logger, PRIVATE_DIR } from '../lib/utils'

const DEFAULT_FILENAME = join(PRIVATE_DIR, 'encrypted.tar.gz.gpg')
const DEFAULT_DEST = PRIVATE_DIR

const helpMessage = `
Usage: bun dedot.ts [options]

Options:
  -h, --help          Show this help message and exit
  -f, --file <filename>  Specify the filename to decrypt (default: ${DEFAULT_FILENAME})
  -d, --dest <directory>  Specify the destination directory for decrypted files (default: ${DEFAULT_DEST})
  -p, --passphrase <passphrase>  Specify the passphrase for decryption (default: from environment variable GPG_PASSPHRASE)
${commonHelp}
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
  ...commonOptions,
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

applyCommonOptions(values)

const filename = values.file || DEFAULT_FILENAME
const dest = values.dest || DEFAULT_DEST
const passphrase = values.passphrase ?? process.env.GPG_PASSPHRASE

if (!filename.endsWith('.gpg')) {
  logger.error(`The specified file "${filename}" does not have a .gpg extension. Please provide a valid GPG encrypted file.`)
  process.exit(1)
}

await access(filename).catch(() => {
  logger.error(`The encrypted file "${filename}" does not exist.`)
  process.exit(1)
})

logger.info(`Decrypting ${filename} to ${dest}...`)

// NOTE: The decrypted tarball lives in a temp directory and is removed
// afterwards. Existing files in `dest` are backed up unless `--no-backup` is set.
await gpgDecryptArchive(filename, dest, passphrase)
