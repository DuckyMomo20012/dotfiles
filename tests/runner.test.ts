import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { findSetupFiles, runSetupFilesInDir, SetupFailedError } from '../lib/utils'
import { makeSandbox } from './helpers'

let sb: Awaited<ReturnType<typeof makeSandbox>>

beforeEach(async () => {
  sb = await makeSandbox()
})
afterEach(async () => {
  await sb.cleanup()
})

/** A setup script that appends its own name to `$ORDER_FILE`. */
function recorder(name: string, code = 0) {
  return `
import { appendFileSync } from 'node:fs'
appendFileSync(process.env.ORDER_FILE!, '${name}\\n')
process.exit(${code})
`
}

async function seed() {
  await sb.write('zeta/setup.ts', recorder('zeta/setup'))
  await sb.write('zeta/a.setup.ts', recorder('zeta/a'))
  await sb.write('alpha/b.setup.ts', recorder('alpha/b'))
  await sb.write('alpha/setup.ts', recorder('alpha/setup'))
  await sb.write('packages/apt.setup.ts', recorder('packages/apt'))
  await sb.write('node_modules/x/setup.ts', recorder('NOPE'))
  await sb.write('private/!setup.ts', recorder('NOPE-disabled'))
  await sb.write('notes.ts', recorder('NOPE-name'))
}

async function run(options: Parameters<typeof runSetupFilesInDir>[1] = {}) {
  const orderFile = sb.path('order.txt')
  await Bun.write(orderFile, '')
  const result = await runSetupFilesInDir(sb.root, { ...options, env: { ORDER_FILE: orderFile, DOTFILES_NO_ERROR_HANDLER: '1' } })
  const order = (await Bun.file(orderFile).text()).split('\n').filter(Boolean)
  return { result, order }
}

describe('findSetupFiles', () => {
  test('finds setup files and skips node_modules and disabled "!" files', async () => {
    await seed()
    expect((await findSetupFiles(sb.root)).sort()).toEqual([
      'alpha/b.setup.ts',
      'alpha/setup.ts',
      'packages/apt.setup.ts',
      'zeta/a.setup.ts',
      'zeta/setup.ts',
    ])
  })
})

describe('runSetupFilesInDir', () => {
  test('runs in a deterministic order: priority dirs, then alphabetical, setup.ts first', async () => {
    await seed()
    const { order } = await run({ priority: ['packages'] })

    expect(order).toEqual(['packages/apt', 'alpha/setup', 'alpha/b', 'zeta/setup', 'zeta/a'])
  })

  test('is repeatable: same order every time', async () => {
    await seed()
    const first = await run()
    const second = await run()

    expect(second.order).toEqual(first.order)
  })

  test('ignores and only', async () => {
    await seed()

    expect((await run({ ignores: ['zeta'] })).order).toEqual(['alpha/setup', 'alpha/b', 'packages/apt'])
    expect((await run({ only: ['alpha'] })).order).toEqual(['alpha/setup', 'alpha/b'])
  })

  test('runMainSetupOnly skips siblings of setup.ts', async () => {
    await seed()
    const { order } = await run({ runMainSetupOnly: true })

    expect(order).toEqual(['alpha/setup', 'packages/apt', 'zeta/setup'])
  })

  test('stops at the first failure by default', async () => {
    await sb.write('a/setup.ts', recorder('a', 3))
    await sb.write('b/setup.ts', recorder('b'))

    await expect(run()).rejects.toBeInstanceOf(SetupFailedError)
    expect((await Bun.file(sb.path('order.txt')).text()).trim()).toBe('a')
  })

  test('keepGoing runs the rest and reports failures', async () => {
    await sb.write('a/setup.ts', recorder('a', 3))
    await sb.write('b/setup.ts', recorder('b'))

    const { result, order } = await run({ keepGoing: true })

    expect(order).toEqual(['a', 'b'])
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0]?.exitCode).toBe(3)
  })
})
