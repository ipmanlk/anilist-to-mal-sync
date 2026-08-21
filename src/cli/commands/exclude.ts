import type { Command } from 'commander'
import { ExcludesSchema } from '../../config/schema.js'
import { JsonFileStore } from '../../config/store.js'
import { ConfigError } from '../../lib/errors.js'

export function registerExcludeCommands(program: Command, getDir: () => string): void {
  const exclude = program.command('exclude').description('Manage manual exclude list')

  exclude
    .command('list')
    .description('List excluded MAL ids')
    .action(async () => {
      const dir = getDir()
      const store = new JsonFileStore<number[]>(dir, 'excludes.json', ExcludesSchema)
      const list = (await store.load()) ?? []
      for (const id of list) process.stdout.write(`${id}\n`)
      if (list.length === 0) process.stdout.write('(empty)\n')
    })

  exclude
    .command('add')
    .description('Add ids to exclude list')
    .argument('<ids...>', 'MAL ids')
    .action(async (ids: string[]) => {
      const dir = getDir()
      const store = new JsonFileStore<number[]>(dir, 'excludes.json', ExcludesSchema)
      const current = new Set<number>((await store.load()) ?? [])
      for (const raw of ids) {
        const n = Number(raw)
        if (!Number.isInteger(n) || n <= 0)
          throw new ConfigError(`Invalid id "${raw}": expected positive integer`)
        current.add(n)
      }
      await store.save([...current])
    })

  exclude
    .command('rm')
    .description('Remove ids from exclude list')
    .argument('<ids...>', 'MAL ids')
    .action(async (ids: string[]) => {
      const dir = getDir()
      const store = new JsonFileStore<number[]>(dir, 'excludes.json', ExcludesSchema)
      const current = new Set<number>((await store.load()) ?? [])
      for (const raw of ids) {
        const n = Number(raw)
        if (!Number.isInteger(n) || n <= 0)
          throw new ConfigError(`Invalid id "${raw}": expected positive integer`)
        current.delete(n)
      }
      await store.save([...current])
    })
}
