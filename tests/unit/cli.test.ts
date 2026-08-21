import { describe, expect, it } from 'vitest'
import { createProgram } from '../../src/cli/program.js'
import { resolveConfigDir } from '../../src/config/paths.js'
import { createLogger } from '../../src/lib/logger.js'

function makeProgram() {
  const logger = createLogger({ json: false, quiet: true, verbose: false })
  const dir = resolveConfigDir('/tmp/test-cli')
  return createProgram({ logger, dir })
}

describe('CLI program', () => {
  it('every command --help renders', async () => {
    const prog = makeProgram()
    const cmds = prog.commands.map((c) => c.name())
    expect(cmds).toEqual(
      expect.arrayContaining(['config', 'login', 'logout', 'export', 'sync', 'watch', 'exclude']),
    )
    const sync = prog.commands.find((c) => c.name() === 'sync')
    expect(sync).toBeDefined()
    const optNames = (sync as NonNullable<typeof sync>).options.map((o) => o.long)
    expect(optNames).toEqual(expect.arrayContaining(['--prune', '--dry-run', '--only', '--limit']))
  })
  it('legacy flags are unknown options', async () => {
    for (const flag of ['--set-user', '--set-client', '--export', '--sync', '--watch', '--login']) {
      const p = makeProgram()
      await expect(p.parseAsync([flag], { from: 'user' })).rejects.toThrow(/unknown option/)
    }
  })
  it('--non-interactive blocks prompts (program opts)', async () => {
    const prog = makeProgram()
    await prog.parseAsync(['--non-interactive', 'config', 'path'], { from: 'user' })
    expect(prog.opts().nonInteractive).toBe(true)
  })
  it('config get/set/path subcommands exist', async () => {
    const prog = makeProgram()
    const cfg = prog.commands.find((c) => c.name() === 'config')
    expect(cfg).toBeDefined()
    const subNames = (cfg as NonNullable<typeof cfg>).commands.map((c) => c.name())
    expect(subNames).toEqual(expect.arrayContaining(['get', 'set', 'path']))
  })
})
