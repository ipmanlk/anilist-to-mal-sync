import path from 'node:path'
import type { Command } from 'commander'
import { AnilistClient } from '../../api/anilist/client.js'
import type { Config } from '../../config/schema.js'
import { ConfigSchema } from '../../config/schema.js'
import { JsonFileStore } from '../../config/store.js'
import { ConfigError } from '../../lib/errors.js'
import type { Logger } from '../../lib/logger.js'
import { exportLists } from '../../usecases/export.js'

export function registerExportCommand(
  program: Command,
  getDir: () => string,
  getLogger: () => Logger,
  getSignal: () => AbortSignal | undefined,
): void {
  program
    .command('export')
    .description('Fetch AniList and write MAL-compatible XML (no MAL auth)')
    .option('--username <name>', 'AniList username')
    .option('--mal-username <name>', 'MAL account name for XML <user_name>')
    .option('--type <type>', 'Which lists (anime|manga|both)', 'both')
    .option('--out <dir>', 'Output directory', '.')
    .option('--force', 'Overwrite existing files', false)
    .action(
      async (opts: {
        username?: string
        malUsername?: string
        type: string
        out: string
        force: boolean
      }) => {
        const dir = getDir()
        const logger = getLogger()
        const signal = getSignal()

        let username = opts.username
        if (username === undefined) {
          const store = new JsonFileStore<Config>(dir, 'config.json', ConfigSchema)
          const cfg = await store.load()
          username = cfg?.anilist.username
          if (username === undefined)
            throw new ConfigError(
              'Provide --username or run: ani2mal config set anilist.username=...',
            )
        }

        const type = opts.type as 'anime' | 'manga' | 'both'
        if (!['anime', 'manga', 'both'].includes(type))
          throw new ConfigError(`Invalid --type "${type}": expected anime|manga|both`)

        const outDir = path.resolve(opts.out)
        const anilist = new AnilistClient(globalThis.fetch)

        const exportOpts: {
          username: string
          type: 'anime' | 'manga' | 'both'
          outDir: string
          force: boolean
          malUsername?: string
        } = {
          username,
          type,
          outDir,
          force: opts.force,
        }
        if (opts.malUsername !== undefined) exportOpts.malUsername = opts.malUsername

        const result = await exportLists(anilist, exportOpts, signal)

        for (const f of result.files) {
          logger.success(`Wrote ${f}`)
        }
        if (result.skippedNoMalId > 0) logger.info(`${result.skippedNoMalId} skipped: no MAL id`)
        if (result.skippedUnknownStatus > 0)
          logger.warn(`${result.skippedUnknownStatus} skipped: unresolvable list status`)
      },
    )
}
