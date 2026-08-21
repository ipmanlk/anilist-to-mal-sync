import { Command } from 'commander'
import type { Logger } from '../lib/logger.js'
import { registerConfigCommands } from './commands/config.js'
import { registerExcludeCommands } from './commands/exclude.js'
import { registerExportCommand } from './commands/export.js'
import { registerLoginCommand } from './commands/login.js'
import { registerLogoutCommand } from './commands/logout.js'
import { registerSyncCommand } from './commands/sync.js'
import { registerWatchCommand } from './commands/watch.js'

export function createProgram(deps: { logger: Logger; signal: AbortSignal; dir: string }): Command {
  const program = new Command()
  program
    .name('ani2mal')
    .description('AniList → MyAnimeList sync — AniList is the source of truth, MAL is the mirror.')
    .version('3.0.0')
    .option('--config-dir <path>', 'Config directory')
    .option('--json', 'Machine-readable output', false)
    .option('--quiet', 'Errors only', false)
    .option('--verbose', 'Debug logs', false)
    .option('--non-interactive', 'Never prompt', false)
    .exitOverride()
    .allowUnknownOption(false)

  const getDir = () => deps.dir
  const getLogger = () => deps.logger
  const getSignal = () => deps.signal
  const isNonInteractive = () => Boolean(program.opts().nonInteractive)

  registerConfigCommands(program, getDir)
  registerLoginCommand(program, getDir, getLogger, isNonInteractive)
  registerLogoutCommand(program, getDir, getLogger)
  registerExportCommand(program, getDir, getLogger, getSignal)
  registerSyncCommand(program, getDir, getLogger, getSignal)
  registerWatchCommand(program, getDir, getLogger, getSignal)
  registerExcludeCommands(program, getDir)

  return program
}
