import { resolve } from 'node:path'
import process from 'node:process'
import { logger, symlinkDotfileDir } from '../../lib/utils'

logger.info('Symlink private dotfiles...')

const privateDir = resolve(__dirname)
console.log('privateDir', privateDir)

await symlinkDotfileDir(privateDir, process.env.HOME ?? '', privateDir)
