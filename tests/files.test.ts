import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { lstat, readdir, readFile, readlink, symlink, writeFile } from 'node:fs/promises'
import { appendUniqueLine, backupFile, linkFile, mergeDir, symlinkDotfileDir } from '../lib/utils'
import { makeSandbox } from './helpers'

let sb: Awaited<ReturnType<typeof makeSandbox>>

beforeEach(async () => {
  sb = await makeSandbox()
})
afterEach(async () => {
  await sb.cleanup()
})

describe('linkFile', () => {
  test('creates a link and parent directories', async () => {
    const source = await sb.write('repo/.zshrc', 'new')
    const result = await linkFile(source, sb.path('home/deep/.zshrc'))

    expect(result.status).toBe('created')
    expect(await readlink(sb.path('home/deep/.zshrc'))).toBe(source)
  })

  test('is a no-op when the link is already correct', async () => {
    const source = await sb.write('repo/.zshrc', 'new')
    await linkFile(source, sb.path('home/.zshrc'))
    const again = await linkFile(source, sb.path('home/.zshrc'))

    expect(again.status).toBe('unchanged')
    expect(await readdir(sb.path('home'))).toEqual(['.zshrc'])
  })

  test('backs up a different file instead of copying its text', async () => {
    const source = await sb.write('repo/.bin', 'repo')
    const original = Buffer.from([0, 255, 1, 254, 2, 0])
    await sb.write('home/.bin', original)

    const result = await linkFile(source, sb.path('home/.bin'))

    expect(result.status).toBe('backed-up')
    expect(result.backupPath).toBe(sb.path('home/.bin.backup'))
    // Byte exact, so binary files survive (the old text based backup corrupted them).
    expect((await readFile(sb.path('home/.bin.backup'))).equals(original)).toBe(true)
    expect(await readlink(sb.path('home/.bin'))).toBe(source)
  })

  test('never overwrites an older backup', async () => {
    const source = await sb.write('repo/.rc', 'repo')
    await sb.write('home/.rc.backup', 'first backup')
    await sb.write('home/.rc', 'second original')

    const result = await linkFile(source, sb.path('home/.rc'))

    expect(await readFile(sb.path('home/.rc.backup'), 'utf8')).toBe('first backup')
    expect(result.backupPath).not.toBe(sb.path('home/.rc.backup'))
    expect(await readFile(result.backupPath!, 'utf8')).toBe('second original')
  })

  test('re-running after a backup does not create more backups', async () => {
    const source = await sb.write('repo/.rc', 'repo')
    await sb.write('home/.rc', 'original')

    await linkFile(source, sb.path('home/.rc'))
    await linkFile(source, sb.path('home/.rc'))
    await linkFile(source, sb.path('home/.rc'))

    expect((await readdir(sb.path('home'))).sort()).toEqual(['.rc', '.rc.backup'])
    expect(await readFile(sb.path('home/.rc.backup'), 'utf8')).toBe('original')
  })

  test('backup: false replaces the file directly', async () => {
    const source = await sb.write('repo/.rc', 'repo')
    await sb.write('home/.rc', 'original')

    const result = await linkFile(source, sb.path('home/.rc'), { backup: false })

    expect(result.status).toBe('overwritten')
    expect(await readdir(sb.path('home'))).toEqual(['.rc'])
    expect(await readlink(sb.path('home/.rc'))).toBe(source)
  })

  test('honors DOTFILES_NO_BACKUP', async () => {
    const source = await sb.write('repo/.rc', 'repo')
    await sb.write('home/.rc', 'original')

    process.env.DOTFILES_NO_BACKUP = '1'
    try {
      await linkFile(source, sb.path('home/.rc'))
    }
    finally {
      delete process.env.DOTFILES_NO_BACKUP
    }

    expect(await readdir(sb.path('home'))).toEqual(['.rc'])
  })

  test('replaces an identical file without a backup', async () => {
    const source = await sb.write('repo/.rc', 'same')
    await sb.write('home/.rc', 'same')

    const result = await linkFile(source, sb.path('home/.rc'))

    expect(result.status).toBe('overwritten')
    expect(await readdir(sb.path('home'))).toEqual(['.rc'])
  })

  test('replaces a symlink that points somewhere else', async () => {
    const source = await sb.write('repo/.rc', 'repo')
    const other = await sb.write('other/.rc', 'other')
    await sb.write('home/placeholder')
    await symlink(other, sb.path('home/.rc'))

    const result = await linkFile(source, sb.path('home/.rc'))

    expect(result.status).toBe('backed-up')
    expect(await readlink(sb.path('home/.rc.backup'))).toBe(other)
    expect(await readlink(sb.path('home/.rc'))).toBe(source)
  })

  test('replaces a dangling symlink', async () => {
    const source = await sb.write('repo/.rc', 'repo')
    await sb.write('home/placeholder')
    await symlink(sb.path('gone'), sb.path('home/.rc'))

    await linkFile(source, sb.path('home/.rc'))

    expect(await readlink(sb.path('home/.rc'))).toBe(source)
  })

  test('refuses to delete a directory without a backup', async () => {
    const source = await sb.write('repo/.cfg', 'repo')
    await sb.write('home/.cfg/inner', 'data')

    await expect(linkFile(source, sb.path('home/.cfg'), { backup: false })).rejects.toThrow('Refusing to overwrite directory')
    expect(await readFile(sb.path('home/.cfg/inner'), 'utf8')).toBe('data')
  })

  test('never touches the source when the target dir is a symlink to the repo', async () => {
    const source = await sb.write('repo/dir/.rc', 'repo')
    await symlink(sb.path('repo/dir'), sb.path('home-dir'))

    const result = await linkFile(source, sb.path('home-dir/.rc'))

    expect(result.status).toBe('unchanged')
    expect(await readFile(source, 'utf8')).toBe('repo')
  })

  test('dry run changes nothing', async () => {
    const source = await sb.write('repo/.rc', 'repo')
    await sb.write('home/.rc', 'original')

    await linkFile(source, sb.path('home/.rc'), { dryRun: true })
    await linkFile(source, sb.path('home/.new'), { dryRun: true })

    expect((await lstat(sb.path('home/.rc'))).isSymbolicLink()).toBe(false)
    expect(await readdir(sb.path('home'))).toEqual(['.rc'])
  })

  test('throws for a missing source', async () => {
    await expect(linkFile(sb.path('nope'), sb.path('home/x'))).rejects.toThrow('missing source')
  })
})

describe('symlinkDotfileDir', () => {
  async function seed() {
    await sb.write('repo/.zshrc', 'zsh')
    await sb.write('repo/.config/app/config.toml', 'cfg')
    await sb.write('repo/.fonts/font.otf', Buffer.from([0, 1, 2, 255]))
    await sb.write('repo/README.md', 'docs')
    await sb.write('repo/!disabled', 'x')
    await sb.write('repo/setup.ts', 'x')
    await sb.write('repo/.x.setup.ts', 'x')
    await sb.write('repo/.zshrc.backup', 'old')
  }

  test('links files keeping the directory layout and skipping non-dotfiles', async () => {
    await seed()
    const summary = await symlinkDotfileDir(sb.path('repo'), sb.path('home'), sb.path('repo'))

    expect(summary.created).toBe(3)
    expect(await readdir(sb.path('home'), { recursive: true })).toEqual(
      expect.arrayContaining(['.zshrc', '.config/app/config.toml', '.fonts/font.otf']),
    )
    expect(await readdir(sb.path('home'))).not.toContain('README.md')
    expect(await readdir(sb.path('home'))).not.toContain('.zshrc.backup')
    expect(await readlink(sb.path('home/.config/app/config.toml'))).toBe(sb.path('repo/.config/app/config.toml'))
  })

  test('defaults the base directory to the source directory', async () => {
    await seed()
    await symlinkDotfileDir(sb.path('repo'), sb.path('home'))

    expect(await readlink(sb.path('home/.zshrc'))).toBe(sb.path('repo/.zshrc'))
  })

  test('is idempotent: second run changes nothing and makes no backups', async () => {
    await seed()
    await sb.write('home/.zshrc', 'pre-existing')

    const first = await symlinkDotfileDir(sb.path('repo'), sb.path('home'))
    const second = await symlinkDotfileDir(sb.path('repo'), sb.path('home'))

    expect(first.backedUp).toBe(1)
    expect(second.created).toBe(0)
    expect(second.backedUp).toBe(0)
    expect(second.unchanged).toBe(3)
    expect(await readFile(sb.path('home/.zshrc.backup'), 'utf8')).toBe('pre-existing')
    expect((await readdir(sb.path('home'))).filter(n => n.includes('backup'))).toEqual(['.zshrc.backup'])
  })

  test('--no-backup style option overwrites directly', async () => {
    await seed()
    await sb.write('home/.zshrc', 'pre-existing')

    await symlinkDotfileDir(sb.path('repo'), sb.path('home'), undefined, { backup: false })

    expect((await readdir(sb.path('home'))).filter(n => n.includes('backup'))).toEqual([])
  })

  test('skips files outside of the base path instead of linking them to odd places', async () => {
    await sb.write('priv/dotfiles/.git-credentials', 'secret')
    await sb.write('priv/update-token.sh', '#!/bin/sh')

    const summary = await symlinkDotfileDir(sb.path('priv'), sb.path('home'), sb.path('priv/dotfiles'))

    expect(summary.created).toBe(1)
    expect(await readlink(sb.path('home/.git-credentials'))).toBe(sb.path('priv/dotfiles/.git-credentials'))
    expect(await readdir(sb.path('home'))).toEqual(['.git-credentials'])
  })

  test('exclude option', async () => {
    await seed()
    await symlinkDotfileDir(sb.path('repo'), sb.path('home'), undefined, { exclude: rel => rel.startsWith('.fonts') })

    expect(await readdir(sb.path('home'))).not.toContain('.fonts')
  })
})

describe('appendUniqueLine', () => {
  test('creates the file, then appends each line once', async () => {
    const file = sb.path('home/.zshrc')

    expect(await appendUniqueLine('export A=1', file)).toBe(true)
    expect(await appendUniqueLine('export A=1', file)).toBe(false)
    expect(await appendUniqueLine('export B=2', file)).toBe(true)
    expect(await appendUniqueLine('export B=2', file)).toBe(false)

    expect(await readFile(file, 'utf8')).toBe('export A=1\nexport B=2\n')
  })

  test('keeps existing content, including a missing final newline', async () => {
    const file = await sb.write('rc', '# header\n\nexport X=1')

    await appendUniqueLine('export Y=2', file)

    expect(await readFile(file, 'utf8')).toBe('# header\n\nexport X=1\nexport Y=2\n')
  })

  test('does not match a substring of another line', async () => {
    const file = await sb.write('rc', 'export PATH=$HOME/bin:$PATH:/extra\n')

    expect(await appendUniqueLine('export PATH=$HOME/bin:$PATH', file)).toBe(true)
  })

  test('writes through a symlink and keeps it a symlink', async () => {
    const real = await sb.write('repo/.zshrc', 'a\n')
    await sb.write('home/placeholder')
    await symlink(real, sb.path('home/.zshrc'))

    await appendUniqueLine('b', sb.path('home/.zshrc'))

    expect((await lstat(sb.path('home/.zshrc'))).isSymbolicLink()).toBe(true)
    expect(await readFile(real, 'utf8')).toBe('a\nb\n')
  })

  test('dry run does not write', async () => {
    const file = sb.path('rc')
    expect(await appendUniqueLine('x', file, { dryRun: true })).toBe(true)
    expect(await readdir(sb.root)).toEqual([])
  })

  test('ignores empty input', async () => {
    expect(await appendUniqueLine('', sb.path('rc'))).toBe(false)
    expect(await appendUniqueLine('x', '')).toBe(false)
  })
})

describe('backupFile', () => {
  test('uses .backup first, then timestamped names', async () => {
    const file = await sb.write('f', '1')
    const first = await backupFile(file)
    await writeFile(file, '2')
    const second = await backupFile(file)

    expect(first).toBe(`${file}.backup`)
    expect(second.startsWith(`${file}.backup.`)).toBe(true)
  })
})

describe('mergeDir', () => {
  test('copies new files, skips identical ones, backs up changed ones', async () => {
    await sb.write('src/a', 'same')
    await sb.write('src/b', 'new')
    await sb.write('src/sub/c', 'fresh')
    await sb.write('dest/a', 'same')
    await sb.write('dest/b', 'old')

    const summary = await mergeDir(sb.path('src'), sb.path('dest'))
    const again = await mergeDir(sb.path('src'), sb.path('dest'))

    expect(summary).toEqual({ copied: 2, unchanged: 1, backedUp: 1 })
    expect(again).toEqual({ copied: 0, unchanged: 3, backedUp: 0 })
    expect(await readFile(sb.path('dest/b.backup'), 'utf8')).toBe('old')
    expect(await readFile(sb.path('dest/b'), 'utf8')).toBe('new')
    expect(await readFile(sb.path('dest/sub/c'), 'utf8')).toBe('fresh')
  })

  test('backup: false overwrites', async () => {
    await sb.write('src/b', 'new')
    await sb.write('dest/b', 'old')

    await mergeDir(sb.path('src'), sb.path('dest'), { backup: false })

    expect(await readdir(sb.path('dest'))).toEqual(['b'])
  })
})
