import type { ParseArgsOptionsConfig } from 'node:util'
import { exists } from 'node:fs/promises'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { gpgImport, logger } from '../scripts/utils'

const DEFAULT_EMAIL = 'example@gmail.com'
const DEFAULT_FILENAME = 'secret.asc'

const helpMessage = `
Usage: bun import.ts [options]

Options:
  -h, --help          Show this help message and exit
  -e, --email <email> Specify the email address to import the GPG key (default: ${DEFAULT_EMAIL})
  -f, --file <filename>  Specify the filename to import the GPG key (default: ${DEFAULT_FILENAME})
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

if (!(await exists(filename))) {
  logger.error(`File ${filename} does not exist.`)
  process.exit(1)
}

await gpgImport(email, filename)
