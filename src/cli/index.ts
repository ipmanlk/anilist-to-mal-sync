import { resolveConfigDir } from '../config/paths.js'
import { CancelledError, CliError, errorMessage, toExitCode } from '../lib/errors.js'
import { createLogger } from '../lib/logger.js'
import { createProgram } from './program.js'

function checkNodeVersion(): void {
  const major = Number(process.versions.node.split('.')[0])
  if (major < 22) {
    throw new CliError(`ani2mal 3 requires Node >= 22 (found ${process.versions.node})`)
  }
}

export async function main(argv: string[] = process.argv): Promise<void> {
  const global = parseGlobalArgs(argv)
  const logger = createLogger({ json: global.json, quiet: global.quiet, verbose: global.verbose })
  const dir = resolveConfigDir(global.configDir)

  const run = new AbortController()
  const interrupt = () => run.abort(new CancelledError('interrupted'))
  process.once('SIGINT', interrupt)
  process.once('SIGTERM', interrupt)

  try {
    checkNodeVersion()
    const program = createProgram({ logger, signal: run.signal, dir })
    await program.parseAsync(argv, { from: 'node' })
    process.exitCode = 0
  } catch (err: unknown) {
    // Commander already prints its own usage errors; we only own the exit code.
    if (isCommanderError(err)) {
      process.exitCode = isCommanderHelpOrVersion(err) ? 0 : 2
      return
    }
    if (err instanceof CancelledError) {
      process.exitCode = 0
      return
    }
    process.exitCode = toExitCode(err)
    logger.error(errorMessage(err))
    if (global.verbose && err instanceof Error && err.stack) {
      process.stderr.write(`${err.stack}\n`)
    }
  } finally {
    process.off('SIGINT', interrupt)
    process.off('SIGTERM', interrupt)
  }
}

function parseGlobalArgs(argv: string[]) {
  let configDir: string | undefined
  let json = false
  let quiet = false
  let verbose = false
  let nonInteractive = false
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--config-dir' && argv[i + 1]) {
      configDir = argv[i + 1]
      i++
    } else if (a === '--json') json = true
    else if (a === '--quiet') quiet = true
    else if (a === '--verbose') verbose = true
    else if (a === '--non-interactive') nonInteractive = true
  }
  return { configDir, json, quiet, verbose, nonInteractive }
}

function isCommanderError(err: unknown): boolean {
  return err instanceof Error && 'code' in err && String(err.code).startsWith('commander.')
}

function isCommanderHelpOrVersion(err: unknown): boolean {
  if (err !== null && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code
    return (
      code === 'commander.help' ||
      code === 'commander.helpDisplayed' ||
      code === 'commander.version'
    )
  }
  return false
}

await main(process.argv)
