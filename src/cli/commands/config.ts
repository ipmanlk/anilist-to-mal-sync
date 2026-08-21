import type { Command } from 'commander'
import type { Config } from '../../config/schema.js'
import { ConfigSchema } from '../../config/schema.js'
import { JsonFileStore } from '../../config/store.js'
import { ConfigError } from '../../lib/errors.js'
import { redactForLogs } from '../../lib/logger.js'

export function registerConfigCommands(program: Command, getDir: () => string): void {
  const config = program.command('config').description('Manage configuration')

  config
    .command('get')
    .description('Print resolved config (secrets redacted)')
    .action(async () => {
      const dir = getDir()
      const store = new JsonFileStore<Config>(dir, 'config.json', ConfigSchema)
      const cfg = await store.load()
      if (!cfg) {
        process.stdout.write('{}\n')
        return
      }
      const redacted = redactForLogs(cfg) as Config
      process.stdout.write(`${JSON.stringify(redacted, null, 2)}\n`)
    })

  config
    .command('set')
    .description('Set config values (anilist.username, mal.clientId, mal.clientSecret)')
    .argument('<kv...>', 'key=value pairs')
    .action(async (kv: string[]) => {
      const dir = getDir()
      const store = new JsonFileStore<Config>(dir, 'config.json', ConfigSchema)
      const loaded = await store.load()
      const cfg: Config = {
        anilist: { ...(loaded?.anilist ?? {}) },
        mal: { ...(loaded?.mal ?? {}) },
      }

      for (const pair of kv) {
        const eq = pair.indexOf('=')
        if (eq === -1) throw new ConfigError(`Invalid assignment "${pair}": expected key=value`)
        const k = pair.slice(0, eq)
        const v = pair.slice(eq + 1)
        if (k === 'anilist.username') cfg.anilist.username = v
        else if (k === 'mal.clientId') cfg.mal.clientId = v
        else if (k === 'mal.clientSecret') cfg.mal.clientSecret = v
        else
          throw new ConfigError(
            `Unknown config key "${k}": allowed are anilist.username, mal.clientId, mal.clientSecret`,
          )
      }

      const parsed = ConfigSchema.parse(cfg)
      await store.save(parsed)
    })

  config
    .command('path')
    .description('Print config directory')
    .action(() => {
      process.stdout.write(`${getDir()}\n`)
    })
}
