import type { ParseArgsOptionsConfig } from 'node:util'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { gpgExport } from '../lib/utils'

const DEFAULT_EMAIL = 'example@gmail.com'
const DEFAULT_FILENAME = 'secret.asc'

const helpMessage = `
Usage: bun export.ts [options]

Options:
  -h, --help          Show this help message and exit
  -e, --email <email> Specify the email address to export the GPG key (default: $GPG_EMAIL, then ${DEFAULT_EMAIL})
  -f, --file <filename>  Specify the destination filename to export the GPG key (default: ${DEFAULT_FILENAME})
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

// NOTE: `gpgExport` creates the parent directory and restricts the file to
// the owner (it holds your secret key).
await gpgExport(email, filename)
