import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

/** Create a temp directory that is removed by the returned `cleanup`. */
export async function makeSandbox(prefix = 'dotfiles-test-') {
  const root = await mkdtemp(join(tmpdir(), prefix))
  return {
    root,
    path: (...parts: string[]) => join(root, ...parts),
    async write(file: string, content: string | Uint8Array = '') {
      const full = join(root, file)
      await mkdir(dirname(full), { recursive: true })
      await writeFile(full, content)
      return full
    },
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}
