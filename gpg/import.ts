import type { ParseArgsOptionsConfig } from 'node:util'
import { access } from 'node:fs/promises'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { applyCommonOptions, commonHelp, commonOptions, gpgImport, logger } from '../lib/utils'

const DEFAULT_EMAIL = 'example@gmail.com'
const DEFAULT_FILENAME = 'secret.asc'

const helpMessage = `
Usage: bun import.ts [options]

Options:
  -h, --help          Show this help message and exit
  -e, --email <email> Specify the email address to import the GPG key (default: $GPG_EMAIL, then ${DEFAULT_EMAIL})
  -f, --file <filename>  Specify the filename to import the GPG key (default: ${DEFAULT_FILENAME})
${commonHelp}

The import is skipped when a secret key for the email is already in the keyring (use --force to import anyway).
`

const options = {
  help: {
    type: 'boolean',
    short: 'h',
  },
  email: {
    type: 'string',
    short: 'e',
  },
  file: {
    type: 'string',
    short: 'f',
    default: DEFAULT_FILENAME,
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

const email = values.email || process.env.GPG_EMAIL || DEFAULT_EMAIL
const filename = values.file || DEFAULT_FILENAME

await access(filename).catch(() => {
  logger.error(`File ${filename} does not exist.`)
  process.exit(1)
})

await gpgImport(email, filename)
