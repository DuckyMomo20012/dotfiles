import { resolve } from 'node:path'
import { getHome, logger, symlinkDotfileDir } from '../../lib/utils'

logger.info('Symlink private dotfiles...')

const privateDir = resolve(__dirname)

// NOTE: Links every file here into $HOME, keeping the layout. Existing files are
// backed up (`<file>.backup`) unless you run with `--no-backup`. Running it
// again changes nothing.
await symlinkDotfileDir(privateDir, getHome(), privateDir)
