import type { ParseArgsOptionsConfig } from 'node:util'
import { exists, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { gpgExport } from '../lib/utils'

const DEFAULT_EMAIL = 'example@gmail.com'
const DEFAULT_FILENAME = 'secret.asc'

const helpMessage = `
Usage: bun export.ts [options]

Options:
  -h, --help          Show this help message and exit
  -e, --email <email> Specify the email address to export the GPG key (default: ${DEFAULT_EMAIL})
  -f, --file <filename>  Specify the destination filename to export the GPG key (default: ${DEFAULT_FILENAME})
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

const dir = dirname(resolve(filename))

if (!(await exists(dir))) {
  await mkdir(dir, { recursive: true })
}

await gpgExport(email, filename)
