import type { Command } from 'commander'
import type { PkceData, Token } from '../../config/schema.js'
import { PkceSchema, TokenSchema } from '../../config/schema.js'
import { JsonFileStore } from '../../config/store.js'
import type { Logger } from '../../lib/logger.js'

export function registerLogoutCommand(
  program: Command,
  getDir: () => string,
  getLogger: () => Logger,
): void {
  program
    .command('logout')
    .description('Delete token and PKCE files')
    .action(async () => {
      const dir = getDir()
      const logger = getLogger()
      const tokenStore = new JsonFileStore<Token>(dir, 'mal_token.json', TokenSchema)
      const pkceStore = new JsonFileStore<PkceData>(dir, 'pkce.json', PkceSchema)
      await tokenStore.delete()
      await pkceStore.delete()
      logger.info(`Logged out. Config dir: ${dir}`)
      logger.info('Run ani2mal login to reconnect.')
    })
}
