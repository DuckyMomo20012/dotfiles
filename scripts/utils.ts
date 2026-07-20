import { existsSync } from 'node:fs'
import { exists, readdir } from 'node:fs/promises'
import { basename, dirname, join, normalize } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { $ } from 'bun'

export const logger = {
  info: (msg: string) => console.log(styleText('cyan', msg)),
  success: (msg: string) => console.log(styleText('green', msg)),
  warn: (msg: string) => console.log(styleText('yellow', msg)),
  error: (msg: string) => console.log(styleText(['red', 'bold'], msg)),
}

export async function appendUniqueLine(line: string, fileName: string) {
  if (!line || !fileName)
    return

  if (!(await exists(fileName))) {
    await Bun.write(fileName, `${line}\n`)
    return
  }

  const fileContent = await Bun.file(fileName).text()
  const lines = fileContent.split('\n').filter(Boolean)

  if (!lines.includes(line)) {
    await Bun.write(fileName, `${fileContent.trimEnd()}\n${line}\n`)
  }
}

export async function startSudo() {
  // 1. Await the first check to block execution until authenticated
  try {
    await $`sudo -v`
    logger.info('Sudo session started. Keeping it alive...')
  }
  catch {
    logger.error('Failed to start sudo session. Check configuration.')
    process.exit(1)
  }

  const controller = new AbortController()
  const { signal } = controller

  // 2. Keep alive every 5 minutes (300000ms)
  // eslint-disable-next-line ts/no-misused-promises
  const interval = setInterval(async () => {
    if (signal.aborted)
      return
    try {
      await $`sudo -v`
    }
    catch {
      logger.error('Sudo refresh failed.')
    }
  }, 300000)

  // Tells Bun it's fine to exit if this is the only timer left
  interval.unref()

  // 3. Centralized Clean Exit
  const cleanup = async (reason: string) => {
    if (controller.signal.aborted)
      return
    controller.abort()
    clearInterval(interval)

    logger.info(`Cleaning up via ${reason}...`)
    try {
      await $`sudo -k`
    }
    catch {}

    process.exit(0)
  }

  process.on('SIGINT', () => void cleanup('SIGINT'))
  process.on('SIGTERM', () => void cleanup('SIGTERM'))

  // Return the manual stop function
  return async () => void cleanup('manual stop')
}

export async function symlinkDotfileDir(sourceDir: string, targetDir: string) {
  const files = (await readdir(sourceDir, { withFileTypes: true, recursive: true, encoding: 'utf-8' }))
  // NOTE: Filter out .setup.ts files and any files starting with '!' or ending
  // with '.md' to avoid linking unnecessary files.
  const dotFiles = files.filter(
    file => file.isFile() && !file.name.startsWith('!') && !file.name.endsWith('.md') && !file.name.includes('.setup'),
  )

  for (const file of dotFiles) {
    const sourcePath = join(sourceDir, file.name)
    const targetPath = join(targetDir, file.name)

    if (await exists(targetPath)) {
      const backupPath = join(targetDir, `${file.name}.backup`)
      logger.warn(`Backing up existing file ${targetPath} to ${backupPath}`)
      await Bun.write(backupPath, await Bun.file(targetPath).text())
    }

    await $`ln -sf ${sourcePath} ${targetPath}`
    logger.success(`Linked ${sourcePath} to ${targetPath}`)
  }
}

// NOTE: Spawn apt-get commands with Bun.spawn to avoid issues with sudo
// password prompts in Bun's $ template literal.
export async function prettyAptInstall(args: string) {
  const proc = Bun.spawn(args.split(' '), { stdout: 'inherit', stderr: 'inherit' })
  const status = await proc.exited

  if (status !== 0) {
    logger.error(`Failed to install packages. Exit code: ${status}`)
    process.exit(1)
  }
}

export const isMainSetupFile = (file: string) => basename(file) === 'setup.ts'

export async function runSetupFilesInDir(dir: string, options: {
  runMainSetupOnly?: boolean
  ignores?: string[]
}) {
  const { runMainSetupOnly = false } = options

  logger.info(`Searching for setup files in directory: "${normalize(dir)}"`)

  const setupFiles = (await Array.fromAsync($`find ${dir} -name "*setup.ts" -not -path "*/node_modules/*" -not -name "!*.setup.*"`.lines())).filter(Boolean).filter((file) => {
    if (options.ignores && options.ignores.some(ignore => file.includes(ignore))) {
      logger.warn(`Ignoring setup file "${file}" due to ignore patterns.`)
      return false
    }
    return true
  })

  if (setupFiles.length === 0) {
    logger.warn(`No setup files found in directory: "${normalize(dir)}"`)
    return
  }

  const groupByDir = setupFiles.reduce((acc, file) => {
    const dir = dirname(file)
    if (acc[dir] === undefined)
      acc[dir] = []
    acc[dir].push(file)
    return acc
  }, {} as Record<string, string[]>)

  for (const [dir, files] of Object.entries(groupByDir)) {
    logger.info(`Running setup files in directory: "${dir}"`)

    const sortedFiles = files.sort((a, b) => {
      const aIsMain = isMainSetupFile(a)
      const bIsMain = isMainSetupFile(b)

      if (aIsMain && !bIsMain)
        return -1
      if (!aIsMain && bIsMain)
        return 1
      return a.localeCompare(b)
    })

    const filteredFiles = sortedFiles.filter((file) => {
      const currentDir = dirname(file)

      if (runMainSetupOnly && existsSync(join(currentDir, 'setup.ts')) && !isMainSetupFile(file)) {
        logger.warn(`Ignoring setup file "${file}" because "${join(currentDir, 'setup.ts')}" exists.`)
        return false
      }

      logger.info(`Found setup file: "${file}"`)
      return true
    })

    for (const file of filteredFiles) {
      logger.info(`Running setup file: ${file}`)
      const proc = Bun.spawn(['bun', 'run', file], { stdout: 'inherit', stderr: 'inherit' })
      const status = await proc.exited

      if (status !== 0) {
        logger.error(`Setup file "${file}"" failed with exit code: ${status}`)
        process.exit(1)
      }
    }
  }
}

export async function gpgDecrypt(
  filename: string,
  dest: string,
  passphrase?: string,
) {
  logger.info(`Decrypting ${filename} to ${dest}...`)

  // NOTE: If no passphrase is provided, the script will attempt to decrypt the
  // file without a passphrase. This is useful for files that are not encrypted
  // with a passphrase or for testing purposes. However, it is recommended to
  // always use a passphrase for sensitive files to ensure their security.
  if (passphrase !== undefined) {
    $`gpg --batch --yes --decrypt --output ${dest} ${filename}`.catch((err) => {
      logger.error(`Failed to decrypt ${filename}: ${err}`)
      process.exit(1)
    })
  }
  else {
    $`gpg --batch --yes --passphrase ${passphrase} --decrypt --output ${dest} ${filename}`.catch(
      (err) => {
        console.error(`Failed to decrypt ${filename}: ${err}`)
        process.exit(1)
      },
    )
  }
  logger.info(`Decrypted ${filename} to ${dest}`)
}

export async function gpgEncrypt(
  email: string,
  filename: string,
  dest: string,
) {
  logger.info(`Encrypting ${dest} to ${filename} for ${email}...`)
  $`gpg --batch --yes --recipient ${email} --output ${filename} --encrypt ${filename}`.catch(
    (err) => {
      logger.error(`Failed to encrypt ${filename}: ${err}`)
      process.exit(1)
    },
  )

  logger.info(`Encrypted ${dest} to ${filename} for ${email}`)
}

export async function gpgExport(
  email: string,
  filename: string,
) {
  logger.info(`Exporting GPG key for ${email} to ${filename}...`)
  $`gpg --armor --export ${email} --output ${filename}`.catch((err) => {
    logger.error(`Failed to export GPG key for ${email} to ${filename}: ${err}`)
    process.exit(1)
  })
  logger.info(`Exported GPG key for ${email} to ${filename}`)
}

export async function gpgImport(
  email: string,
  filename: string,
) {
  logger.info(`Importing GPG key for ${email} from ${filename}...`)
  $`gpg --batch --import-options restore --import ${filename}`.catch((err) => {
    logger.error(`Failed to import GPG key for ${email} from ${filename}: ${err}`)
    process.exit(1)
  })
  logger.info(`Imported GPG key for ${email} from ${filename}`)
}
