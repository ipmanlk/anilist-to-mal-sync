import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MalClient } from '../../src/api/mal/client.js'

function makeTokenProvider(token = 'tok1234567890', refreshImpl?: () => Promise<unknown>) {
  return {
    getAccessToken: vi.fn().mockResolvedValue(token),
    refresh: refreshImpl
      ? vi.fn(refreshImpl as never)
      : vi.fn().mockResolvedValue({
          access_token: 'new',
          refresh_token: 'r',
          token_type: 'Bearer',
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        }),
  } as unknown as import('../../src/ports/token.js').TokenProvider
}

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('MalClient read pagination', () => {
  it('terminates on paging.next: null after exactly 1000 items (no third request)', async () => {
    let calls = 0
    server.use(
      http.get(/api\.myanimelist\.net\/v2\/users\/@me\/animelist/, ({ request }) => {
        calls++
        const url = new URL(request.url)
        const offset = url.searchParams.get('offset')
        if (offset === '0') {
          return HttpResponse.json({
            data: [
              {
                node: { id: 1, title: 'A', num_episodes: 12 },
                list_status: {
                  status: 'watching',
                  score: 7,
                  num_episodes_watched: 5,
                  is_rewatching: false,
                },
              },
            ],
            paging: {
              next: 'https://api.myanimelist.net/v2/users/@me/animelist?fields=list_status&limit=1000&offset=1000&nsfw=true',
            },
          })
        }
        // second page exactly 1000 items would be big, we sim with 1 item and paging null
        return HttpResponse.json({
          data: [
            {
              node: { id: 2, title: 'B', num_episodes: 12 },
              list_status: {
                status: 'watching',
                score: 7,
                num_episodes_watched: 5,
                is_rewatching: false,
              },
            },
          ],
          paging: {},
        })
      }),
      http.get(/api\.myanimelist\.net\/v2\/users\/@me\/mangalist/, () =>
        HttpResponse.json({ data: [], paging: {} }),
      ),
    )
    const tp = makeTokenProvider()
    const c = new MalClient(globalThis.fetch, tp)
    const res = await c.getLists()
    expect(res.anime).toHaveLength(2)
    expect(calls).toBe(2)
  })

  it('continues when data: [] but paging.next present', async () => {
    let calls = 0
    server.use(
      http.get(/api\.myanimelist\.net\/v2\/users\/@me\/animelist/, ({ request }) => {
        calls++
        const url = new URL(request.url)
        if (url.searchParams.get('offset') === '0')
          return HttpResponse.json({
            data: [],
            paging: {
              next: 'https://api.myanimelist.net/v2/users/@me/animelist?fields=list_status&limit=1000&offset=1000&nsfw=true',
            },
          })
        return HttpResponse.json({
          data: [
            {
              node: { id: 5, title: 'E', num_episodes: 12 },
              list_status: {
                status: 'watching',
                score: 5,
                num_episodes_watched: 1,
                is_rewatching: false,
              },
            },
          ],
          paging: {},
        })
      }),
      http.get(/api\.myanimelist\.net\/v2\/users\/@me\/mangalist/, () =>
        HttpResponse.json({ data: [], paging: {} }),
      ),
    )
    const tp = makeTokenProvider()
    const c = new MalClient(globalThis.fetch, tp)
    const res = await c.getLists()
    expect(res.anime).toHaveLength(1)
    expect(calls).toBe(2)
  })

  it('query strings carry nsfw=true', async () => {
    const urls: string[] = []
    server.use(
      http.get(/api\.myanimelist\.net\/v2\/users\/@me\/.*list/, ({ request }) => {
        urls.push(request.url)
        return HttpResponse.json({ data: [], paging: {} })
      }),
    )
    const tp = makeTokenProvider()
    const c = new MalClient(globalThis.fetch, tp)
    await c.getLists()
    expect(urls.every((u) => u.includes('nsfw=true'))).toBe(true)
    expect(urls.every((u) => u.includes('limit=1000'))).toBe(true)
  })
})

describe('MalClient write', () => {
  it('PUT body has correct keys for anime', async () => {
    let body = ''
    server.use(
      http.put(/api\.myanimelist\.net\/v2\/anime\/\d+\/my_list_status/, async ({ request }) => {
        body = await request.text()
        return HttpResponse.json({})
      }),
    )
    const tp = makeTokenProvider()
    const c = new MalClient(globalThis.fetch, tp)
    const media = {
      type: 'anime',
      id: 1,
      progress: 5,
      score: 8,
      status: 'current',
      repeat: 1,
      length: 12,
    } as never
    await c.updateOne(media)
    const p = new URLSearchParams(body)
    expect(p.get('status')).toBe('watching')
    expect(p.get('score')).toBe('8')
    expect(p.get('num_watched_episodes')).toBe('5')
    expect(p.get('is_rewatching')).toBe('true')
  })
  it('PUT body for manga', async () => {
    let body = ''
    server.use(
      http.put(/api\.myanimelist\.net\/v2\/manga\/\d+\/my_list_status/, async ({ request }) => {
        body = await request.text()
        return HttpResponse.json({})
      }),
    )
    const tp = makeTokenProvider()
    const c = new MalClient(globalThis.fetch, tp)
    const media = {
      type: 'manga',
      id: 101,
      progress: 3,
      score: 7,
      status: 'current',
      repeat: 0,
      length: 50,
    } as never
    await c.updateOne(media)
    const p = new URLSearchParams(body)
    expect(p.get('num_chapters_read')).toBe('3')
    expect(p.get('is_rereading')).toBe('false')
  })
  it('DELETE has no body', async () => {
    let hasBody = false
    server.use(
      http.delete(/api\.myanimelist\.net\/v2\/anime\/\d+\/my_list_status/, async ({ request }) => {
        const t = await request.text()
        hasBody = t.length > 0
        return HttpResponse.json({})
      }),
    )
    const tp = makeTokenProvider()
    const c = new MalClient(globalThis.fetch, tp)
    await c.deleteOne({
      type: 'anime',
      id: 1,
      progress: 0,
      score: 0,
      status: 'current',
      repeat: 0,
      length: null,
    } as never)
    expect(hasBody).toBe(false)
  })
})

describe('MalClient 401 and 429', () => {
  it('401 → one refresh then retry succeeds', async () => {
    let putCalls = 0
    server.use(
      http.put(/api\.myanimelist\.net\/v2\/anime\/\d+\/my_list_status/, () => {
        putCalls++
        if (putCalls === 1) return HttpResponse.json({}, { status: 401 })
        return HttpResponse.json({})
      }),
    )
    const tp = makeTokenProvider('oldtoken', async () => ({
      access_token: 'newtoken123456',
      refresh_token: 'r',
      token_type: 'Bearer',
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    }))
    const c = new MalClient(globalThis.fetch, tp)
    await c.updateOne({
      type: 'anime',
      id: 1,
      progress: 1,
      score: 5,
      status: 'current',
      repeat: 0,
      length: null,
    } as never)
    expect(tp.refresh).toHaveBeenCalledTimes(1)
    expect(putCalls).toBe(2)
  })
  it('second 401 → AuthError', async () => {
    server.use(
      http.put(/api\.myanimelist\.net\/v2\/anime\/\d+\/my_list_status/, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    )
    const tp = makeTokenProvider('old', async () => ({
      access_token: 'new1234567890',
      refresh_token: 'r',
      token_type: 'Bearer',
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    }))
    const c = new MalClient(globalThis.fetch, tp)
    await expect(
      c.updateOne({
        type: 'anime',
        id: 1,
        progress: 1,
        score: 5,
        status: 'current',
        repeat: 0,
        length: null,
      } as never),
    ).rejects.toThrow(/Refresh token expired/)
  })
  it('429 respects Retry-After', async () => {
    let calls = 0
    server.use(
      http.put(/api\.myanimelist\.net\/v2\/anime\/\d+\/my_list_status/, () => {
        calls++
        if (calls < 3)
          return new HttpResponse(null, { status: 429, headers: { 'Retry-After': '0' } })
        return HttpResponse.json({})
      }),
    )
    const tp = makeTokenProvider()
    const c = new MalClient(globalThis.fetch, tp)
    await c.updateOne({
      type: 'anime',
      id: 1,
      progress: 1,
      score: 5,
      status: 'current',
      repeat: 0,
      length: null,
    } as never)
    expect(calls).toBe(3)
  })
})
