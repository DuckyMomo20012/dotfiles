import type { ParseArgsOptionsConfig } from 'node:util'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import {
  applyCommonOptions,
  commonHelp,
  commonOptions,
  config,
  DOTFILES_DIR,
  getHome,
  gpgDecryptArchive,
  gpgImport,
  logger,
  PRIVATE_DIR,
  ROOT_DIR,
  runSetupFilesInDir,
  startSudo,
  symlinkDotfileDir,
} from './lib/utils'

const DEFAULT_DEDOT = false

// NOTE: Directories that must be set up before the others (they provide
// curl/git/build tools, package managers...). Everything else runs alphabetically.
const SETUP_PRIORITY = ['packages', 'install_deb', 'brew']

const helpMessage = `
Usage: bun bootstrap.ts [options]

Options:
  -h, --help          Show this help message and exit
  -d, --dedot         Run the dedot script to decrypt files (default: ${DEFAULT_DEDOT})
  -s, --secret <file>   Specify the GPG secret file to use for decryption
  -e, --email <email>     Specify the email associated with the GPG key
  -p, --passphrase <passphrase>   Specify the passphrase for the GPG key
${commonHelp}
      --only <name>   Run only setup files whose path contains <name> (repeatable, e.g. --only devops)
      --skip <name>   Skip setup files whose path contains <name> (repeatable, e.g. --skip docker)
      --keep-going    Do not stop at the first failing setup file, report all failures at the end

Environment: GPG_SECRET_FILE, GPG_EMAIL, GPG_PASSPHRASE can replace the matching options.
The script is safe to run again and again: finished work is detected and skipped.
`

const options = {
  help: {
    type: 'boolean',
    short: 'h',
  },
  dedot: {
    type: 'boolean',
    short: 'd',
    default: DEFAULT_DEDOT,
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
  only: {
    type: 'string',
    multiple: true,
  },
  skip: {
    type: 'string',
    multiple: true,
  },
  'keep-going': {
    type: 'boolean',
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

// NOTE: This also reaches every setup file, they run as child processes.
applyCommonOptions(values)

const isDedot = values.dedot ?? DEFAULT_DEDOT
const gpgSecretFile = values.secret ?? process.env.GPG_SECRET_FILE
const gpgEmail = values.email ?? process.env.GPG_EMAIL
const gpgPassphrase = values.passphrase ?? process.env.GPG_PASSPHRASE
const splitList = (list: string[] | undefined) => (list ?? []).flatMap(item => item.split(',')).map(item => item.trim()).filter(Boolean)
const only = splitList(values.only)
const skip = splitList(values.skip)
const keepGoing = values['keep-going'] ?? false

const home = getHome()
const failures: { file: string, exitCode: number }[] = []

if (config.dryRun)
  logger.warn('Dry run: nothing will be changed.')

// NOTE: Ask for the sudo password once and keep it alive for the whole run.
await startSudo()

if (skip.includes('asdf')) {
  logger.warn('Skipping asdf (--skip asdf).')
}
else {
  logger.info('Installing asdf...')
  const asdf = await runSetupFilesInDir(join(ROOT_DIR, 'asdf'), { runMainSetupOnly: false, ignores: skip, only, keepGoing })
  failures.push(...asdf.failed)
}

logger.info('Running setup files...')

// NOTE: Install setup files in the repository, ignoring the "asdf" directory
// (already done above) and "private" (decrypted and run at the end, when
// requested with --dedot).
const main = await runSetupFilesInDir(ROOT_DIR, {
  runMainSetupOnly: false,
  ignores: ['asdf', 'private', ...skip],
  only,
  priority: SETUP_PRIORITY,
  keepGoing,
})
failures.push(...main.failed)

logger.info(`Symlinking dotfiles from "${DOTFILES_DIR}" to home directory...`)
await symlinkDotfileDir(DOTFILES_DIR, home, DOTFILES_DIR)

if (isDedot) {
  logger.info('Importing GPG key...')

  const interactive = process.stdin.isTTY === true

  // NOTE: Prompt the gpg secret file to import to gpg
  // eslint-disable-next-line no-alert
  const gpgFile = gpgSecretFile ?? (interactive ? prompt('Please enter the path to your GPG secret file (e.g., secret.asc): ', 'secret.asc') : null) ?? 'secret.asc'

  // NOTE: Prompt the email associated with the GPG key
  // eslint-disable-next-line no-alert
  const email = gpgEmail ?? (interactive ? prompt('Please enter the email associated with your GPG key: ') : null)

  if (email === null || email.trim() === '') {
    logger.error('Email is required to import the GPG key. Pass --email or set GPG_EMAIL.')
    process.exit(1)
  }

  await access(gpgFile).catch(() => {
    if (!config.dryRun) {
      logger.error(`GPG secret file "${gpgFile}" does not exist. Pass --secret <file> or set GPG_SECRET_FILE.`)
      process.exit(1)
    }
  })

  await gpgImport(email, gpgFile)

  const encryptedFile = join(PRIVATE_DIR, 'encrypted.tar.gz.gpg')

  // NOTE: Prompt the password to decrypt the file
  // eslint-disable-next-line no-alert
  const passphrase = gpgPassphrase ?? (interactive ? prompt('Please enter the passphrase to decrypt the file: ', '') : null) ?? ''

  if (passphrase.trim() === '') {
    logger.warn('Passphrase is empty. Decryption may fail if the file is encrypted with a passphrase')
  }

  logger.info(`Decrypting ${encryptedFile} to ${PRIVATE_DIR}...`)

  // NOTE: Decrypts in a temp directory (the plain tarball is never left in the
  // repository), then merges into `private/`. Changed files are backed up.
  await gpgDecryptArchive(encryptedFile, PRIVATE_DIR, passphrase)

  // NOTE: The archive keeps the same layout as `dotfiles/`, i.e. private/dotfiles/.gitconfig.local
  const privateDotfiles = join(PRIVATE_DIR, 'dotfiles')

  if (config.dryRun || await access(privateDotfiles).then(() => true, () => false)) {
    logger.info(`Symlink private dotfiles from "${privateDotfiles}" to home directory...`)
    await symlinkDotfileDir(privateDotfiles, home, privateDotfiles)
  }
  else {
    logger.warn(`No "${privateDotfiles}" directory in the private archive, nothing to symlink.`)
  }

  logger.info(`Running private setup files from "${PRIVATE_DIR}"...`)

  const priv = await runSetupFilesInDir(PRIVATE_DIR, { runMainSetupOnly: false, ignores: skip, only, keepGoing })
  failures.push(...priv.failed)
}

if (failures.length > 0) {
  logger.error(`Finished with ${failures.length} failed setup file(s):`)
  for (const { file, exitCode } of failures)
    logger.error(`  - ${file} (exit ${exitCode})`)
  process.exit(1)
}

logger.success(config.dryRun ? 'Dry run finished. Nothing was changed.' : 'All done.')
