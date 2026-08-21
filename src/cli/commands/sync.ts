import type { Command } from 'commander'
import { PartialSyncError } from '../../lib/errors.js'
import type { Logger } from '../../lib/logger.js'
import { syncOnce } from '../../usecases/sync.js'
import { parseLimit, parseOnly } from '../options.js'
import { loadSyncContext } from '../wiring.js'

export function registerSyncCommand(
  program: Command,
  getDir: () => string,
  getLogger: () => Logger,
  getSignal: () => AbortSignal,
): void {
  program
    .command('sync')
    .description('Diff AniList → MAL and apply updates')
    .option('--prune', 'Also delete MAL items absent from AniList', false)
    .option('--dry-run', 'Preview diff without writes', false)
    .option('--only <type>', 'Restrict to anime|manga')
    .option('--limit <n>', 'Concurrent MAL writes (1-10)', '5')
    .action(async (opts: { prune: boolean; dryRun: boolean; only?: string; limit: string }) => {
      const logger = getLogger()
      const signal = getSignal()
      const ctx = await loadSyncContext(getDir(), signal)

      const result = await syncOnce(
        { anilist: ctx.anilist, mal: ctx.mal },
        {
          anilistUsername: ctx.cfg.anilist.username,
          prune: opts.prune,
          dryRun: opts.dryRun,
          concurrency: parseLimit(opts.limit),
          excludes: ctx.excludes,
          logger,
          only: parseOnly(opts.only),
        },
        signal,
      )

      if (opts.dryRun) {
        process.stdout.write(
          `${JSON.stringify(
            {
              changes: {
                anime: {
                  update: result.diff.anime.update.length,
                  delete: result.diff.anime.delete.length,
                },
                manga: {
                  update: result.diff.manga.update.length,
                  delete: result.diff.manga.delete.length,
                },
              },
              applied: result.applied,
              failed: result.failed,
            },
            null,
            2,
          )}\n`,
        )
      } else if (result.failed.length > 0) {
        throw new PartialSyncError(`Partial sync: ${result.failed.length} failed`)
      }
    })
}
