import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { describe, expect, it } from 'vitest'
import { TokenProviderImpl } from '../../src/auth/token-provider.js'
import { TokenSchema } from '../../src/config/schema.js'
import { JsonFileStore } from '../../src/config/store.js'

const server = setupServer()

import { afterAll, afterEach, beforeAll } from 'vitest'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('TokenProvider', () => {
  it('single-flight coalesces concurrent refresh', async () => {
    let tokenCalls = 0
    server.use(
      http.post('https://myanimelist.net/v1/oauth2/token', async () => {
        tokenCalls++
        await new Promise((r) => setTimeout(r, 20))
        return HttpResponse.json({
          access_token: 'new_access12345',
          refresh_token: 'new_refresh12345',
          token_type: 'Bearer',
          expires_in: 3600,
        })
      }),
    )
    const dir = await mkdtemp(path.join(tmpdir(), 'tok-'))
    try {
      const store = new JsonFileStore(dir, 'mal_token.json', TokenSchema)
      const expiring = {
        access_token: 'old_access12345',
        refresh_token: 'old_refresh12345',
        token_type: 'Bearer' as const,
        expires_at: new Date(Date.now() + 30 * 1000).toISOString(),
      }
      await store.save(expiring)
      const cfg = { anilist: {}, mal: { clientId: '12345678' } } as never
      const tp = new TokenProviderImpl(store, cfg, globalThis.fetch)
      const [a, b] = await Promise.all([tp.getAccessToken(), tp.getAccessToken()])
      expect(a).toBe('new_access12345')
      expect(b).toBe('new_access12345')
      expect(tokenCalls).toBe(1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('proactive refresh when expiring in 30s, not when 10min', async () => {
    let calls = 0
    server.use(
      http.post('https://myanimelist.net/v1/oauth2/token', () => {
        calls++
        return HttpResponse.json({
          access_token: 'new_access12345',
          refresh_token: 'new_refresh12345',
          token_type: 'Bearer',
          expires_in: 3600,
        })
      }),
    )
    const dir = await mkdtemp(path.join(tmpdir(), 'tok-'))
    try {
      const store = new JsonFileStore(dir, 'mal_token.json', TokenSchema)
      // expiring in 30s => should refresh
      await store.save({
        access_token: 'old_access12345',
        refresh_token: 'old_refresh12345',
        token_type: 'Bearer',
        expires_at: new Date(Date.now() + 30 * 1000).toISOString(),
      })
      const cfg = { anilist: {}, mal: { clientId: '12345678' } } as never
      const tp = new TokenProviderImpl(store, cfg, globalThis.fetch)
      await tp.getAccessToken()
      expect(calls).toBe(1)
      // reset for far future
      calls = 0
      await store.save({
        access_token: 'old_access12345',
        refresh_token: 'old_refresh12345',
        token_type: 'Bearer',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      const tp2 = new TokenProviderImpl(store, cfg, globalThis.fetch)
      await tp2.getAccessToken()
      expect(calls).toBe(0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
