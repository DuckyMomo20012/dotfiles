import type { ParseArgsOptionsConfig } from 'node:util'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { $ } from 'bun'
import { gpgDecrypt, gpgImport, logger, runSetupFilesInDir, symlinkDotfileDir } from './lib/utils'

const DEfAULT_DEDOT = false

const helpMessage = `
Usage: bun bootstrap.ts [options]

Options:
  -h, --help          Show this help message and exit
  -d, --dedot         Run the dedot script to decrypt files (default: ${DEfAULT_DEDOT})
  -s, --secret <file>   Specify the GPG secret file to use for decryption
  -e, --email <email>     Specify the email associated with the GPG key
  -p, --passphrase <passphrase>   Specify the passphrase for the GPG key
`

const options = {
  help: {
    type: 'boolean',
    short: 'h',
  },
  dedot: {
    type: 'boolean',
    short: 'd',
    default: DEfAULT_DEDOT,
  },
  secret: {
    type: 'string',
    short: 's',
  },
  email: {
    type: 'string',
    short: 'e',
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

const isDedot = values.dedot ?? DEfAULT_DEDOT
const gpgSecretFile = values.secret ?? process.env.GPG_SECRET_FILE
const gpgEmail = values.email ?? process.env.GPG_EMAIL
const gpgPassphrase = values.passphrase ?? process.env.GPG_PASSPHRASE

logger.info('Installing asdf...')
await runSetupFilesInDir('./asdf', { runMainSetupOnly: false })

logger.info('Running setup files...')

// NOTE: Install setup files in the current directory, ignoring any setup files
// in the "asdf" directory
await runSetupFilesInDir('.', { runMainSetupOnly: false, ignores: ['asdf'] })

const DOTFILES_DIR = resolve(__dirname, './dotfiles')

logger.info(`Symlinking dotfiles from "${DOTFILES_DIR}" to home directory...`)
await symlinkDotfileDir(DOTFILES_DIR, process.env.HOME ?? '', DOTFILES_DIR)

if (isDedot) {
  logger.info('Importing GPG key...')

  // NOTE: Prompt the gpg secret file to import to gpg
  // eslint-disable-next-line no-alert
  const gpgFile = gpgSecretFile ?? prompt('Please enter the path to your GPG secret file (e.g., secret.asc): ', 'secret.asc') ?? 'secret.asc'

  // NOTE: Prompt the email associated with the GPG key
  // eslint-disable-next-line no-alert
  const email = gpgEmail ?? prompt('Please enter the email associated with your GPG key: ')

  if (email === null || email.trim() === '') {
    logger.error('Email is required to import the GPG key.')
    process.exit(1)
  }

  await gpgImport(email, gpgFile)

  const encryptedFile = join(resolve(__dirname, './private'), 'encrypted.tar.gz.gpg')

  logger.info(`Decrypting encrypted file: ${encryptedFile}...`)

  // NOTE: Prompt the password to decrypt the file
  // eslint-disable-next-line no-alert
  const passphrase = gpgPassphrase ?? prompt('Please enter the passphrase to decrypt the file: ', '') ?? ''

  if (passphrase.trim() === '') {
    logger.warn('Passphrase is empty. Decryption may fail if the file is encrypted with a passphrase')
  }

  const privateDir = resolve(__dirname, './private')

  logger.info(`Decrypting ${encryptedFile} to ${privateDir}...`)

  const tarFile = encryptedFile.replace('.gpg', '')

  await gpgDecrypt(encryptedFile, tarFile, passphrase)

  logger.info(`Extracting decrypted file ${tarFile} to ${privateDir}...`)

  await $`tar -xvf ${tarFile} -C ${privateDir}`

  logger.info(`Symlink private dotfiles from "${privateDir}" to home directory...`)

  await symlinkDotfileDir(privateDir, process.env.HOME ?? '', `${privateDir}/dotfiles`)

  logger.info(`Running private setup files from "${privateDir}"...`)

  await runSetupFilesInDir(privateDir, { runMainSetupOnly: false })
}
