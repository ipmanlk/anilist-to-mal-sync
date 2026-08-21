import type { Token } from '../config/schema.js'

export interface TokenProvider {
  getAccessToken(signal?: AbortSignal): Promise<string>
  refresh(signal?: AbortSignal): Promise<Token>
}
