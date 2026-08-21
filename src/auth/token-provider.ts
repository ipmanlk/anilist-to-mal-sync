import type { Config, Token } from '../config/schema.js'
import type { JsonFileStore } from '../config/store.js'
import { AuthError } from '../lib/errors.js'
import type { TokenProvider } from '../ports/token.js'
import { exchangeToken } from './oauth.js'

export class TokenProviderImpl implements TokenProvider {
  private token: Token | undefined
  private loaded = false
  private refreshInFlight: Promise<Token> | null = null

  constructor(
    private store: JsonFileStore<Token>,
    private cfg: Config,
    private fetchImpl: typeof fetch = globalThis.fetch,
    private signal?: AbortSignal,
  ) {}

  async getAccessToken(signal?: AbortSignal): Promise<string> {
    if (!this.loaded) {
      this.token = await this.store.load()
      this.loaded = true
    }
    if (this.token === undefined) throw new AuthError('Not logged in. Run: ani2mal login')
    if (this.expiresWithin(this.token, 60_000)) await this.refresh(signal)
    return this.token.access_token
  }

  async refresh(signal?: AbortSignal): Promise<Token> {
    if (this.refreshInFlight) return this.refreshInFlight
    this.refreshInFlight = this.doRefresh(signal).finally(() => {
      this.refreshInFlight = null
    })
    return this.refreshInFlight
  }

  private async doRefresh(signal?: AbortSignal): Promise<Token> {
    if (this.token === undefined) throw new AuthError('Not logged in. Run: ani2mal login')
    if (this.cfg.mal.clientId === undefined)
      throw new AuthError('mal.clientId is required — run: ani2mal config set mal.clientId=...')
    const params: Record<string, string> & {
      grant_type: 'refresh_token'
      refresh_token: string
      client_id: string
    } = {
      grant_type: 'refresh_token',
      refresh_token: this.token.refresh_token,
      client_id: this.cfg.mal.clientId,
    }
    const extra: { client_secret?: string } = {}
    if (this.cfg.mal.clientSecret !== undefined) extra.client_secret = this.cfg.mal.clientSecret
    const next = await exchangeToken({ ...params, ...extra }, this.fetchImpl, signal ?? this.signal)
    this.token = next
    await this.store.save(next)
    return next
  }

  private expiresWithin(token: Token, ms: number): boolean {
    const expiresAt = new Date(token.expires_at).getTime()
    return expiresAt - Date.now() < ms
  }
}
