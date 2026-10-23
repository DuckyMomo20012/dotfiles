import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { appendToShellRc, cobraCompletion } from '../lib/utils'
import { makeSandbox } from './helpers'

let sb: Awaited<ReturnType<typeof makeSandbox>>
let previousHome: string | undefined

beforeEach(async () => {
  sb = await makeSandbox()
  previousHome = process.env.HOME
  process.env.HOME = sb.root
})
afterEach(async () => {
  process.env.HOME = previousHome
  await sb.cleanup()
})

describe('appendToShellRc', () => {
  test('only touches shells whose rc file exists', async () => {
    await sb.write('.zshrc', '# zsh\n')

    const changed = await appendToShellRc('export A=1')

    expect(changed).toEqual([sb.path('.zshrc')])
    expect(await readFile(sb.path('.zshrc'), 'utf8')).toBe('# zsh\nexport A=1\n')
  })

  test('is idempotent', async () => {
    await sb.write('.bashrc', '')
    await sb.write('.zshrc', '')

    await appendToShellRc(shell => `echo ${shell}`)
    const second = await appendToShellRc(shell => `echo ${shell}`)

    expect(second).toEqual([])
    expect(await readFile(sb.path('.bashrc'), 'utf8')).toBe('echo bash\n')
    expect(await readFile(sb.path('.zshrc'), 'utf8')).toBe('echo zsh\n')
  })

  test('can write to another file while gating on the rc file', async () => {
    await sb.write('.bashrc', '')

    await appendToShellRc(['export A=1', 'export B=2'], { files: { bash: '.bash_profile', zsh: '.zprofile' } })

    expect(await readFile(sb.path('.bash_profile'), 'utf8')).toBe('export A=1\nexport B=2\n')
    expect(await Bun.file(sb.path('.zprofile')).exists()).toBe(false)
  })

  test('cobraCompletion matches the lines written by the original scripts', () => {
    expect(cobraCompletion('kubectl')('zsh')).toBe('if command -v kubectl >/dev/null 2>&1; then source <(kubectl completion zsh); fi')
    expect(cobraCompletion('argocd', ' compdef _argocd argocd;')('bash')).toBe(
      'if command -v argocd >/dev/null 2>&1; then source <(argocd completion bash); compdef _argocd argocd; fi',
    )
  })
})
