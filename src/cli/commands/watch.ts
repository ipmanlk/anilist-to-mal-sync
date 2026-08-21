import type { Command } from 'commander'
import type { Logger } from '../../lib/logger.js'
import { watchLoop } from '../../usecases/watch.js'
import { parseInterval, parseLimit, parseOnly } from '../options.js'
import { loadSyncContext } from '../wiring.js'

export function registerWatchCommand(
  program: Command,
  getDir: () => string,
  getLogger: () => Logger,
  getSignal: () => AbortSignal,
): void {
  program
    .command('watch')
    .description('Poll sync on interval')
    .option('--interval <time>', 'Poll interval (e.g. 30m, 5m min, 24h max, 0=once)', '30m')
    .option('--prune', 'Also delete MAL items absent from AniList', false)
    .option('--dry-run', 'Preview only', false)
    .option('--only <type>', 'Restrict to anime|manga')
    .option('--limit <n>', 'Concurrent writes (1-10)', '5')
    .action(
      async (opts: {
        interval: string
        prune: boolean
        dryRun: boolean
        only?: string
        limit: string
      }) => {
        const logger = getLogger()
        const signal = getSignal()
        const ctx = await loadSyncContext(getDir(), signal)

        await watchLoop(
          { anilist: ctx.anilist, mal: ctx.mal },
          {
            anilistUsername: ctx.cfg.anilist.username,
            prune: opts.prune,
            dryRun: opts.dryRun,
            concurrency: parseLimit(opts.limit),
            excludes: ctx.excludes,
            logger,
            only: parseOnly(opts.only),
            intervalMs: parseInterval(opts.interval),
          },
          signal,
        )
      },
    )
}
