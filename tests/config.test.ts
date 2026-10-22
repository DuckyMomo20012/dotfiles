import { afterEach, describe, expect, test } from 'bun:test'
import { config, configFromArgv, isTruthy, setConfig } from '../lib/utils'

afterEach(() => {
  setConfig({ dryRun: false, force: false, verbose: false, backup: true })
})

describe('config', () => {
  test('isTruthy', () => {
    expect(['1', 'true', 'yes', 'on', 'anything'].map(isTruthy)).toEqual([true, true, true, true, true])
    expect(['', '0', 'false', 'no', 'off', 'FALSE', undefined].map(isTruthy)).toEqual([false, false, false, false, false, false, false])
  })

  test('backup is on by default and switched off by --no-backup', () => {
    expect(config.backup).toBe(true)
    setConfig(configFromArgv(['--no-backup']))
    expect(config.backup).toBe(false)
    setConfig({ backup: true })
    expect(config.backup).toBe(true)
  })

  test('configFromArgv ignores unrelated arguments', () => {
    expect(configFromArgv(['--email', 'a@b.c', '--dry-run', '-x', '--force'])).toEqual({ dryRun: true, force: true })
  })

  test('setConfig round-trips', () => {
    setConfig({ dryRun: true, verbose: true })
    expect(config.dryRun).toBe(true)
    expect(config.verbose).toBe(true)
    setConfig({ dryRun: false })
    expect(config.dryRun).toBe(false)
  })
})
