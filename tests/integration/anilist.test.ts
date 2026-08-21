import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { AnilistClient } from '../../src/api/anilist/client.js'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AnilistClient', () => {
  it('sends variables.userName and not interpolated', async () => {
    let body: unknown
    server.use(
      http.post('https://graphql.anilist.co', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { MediaListCollection: { lists: [] } } })
      }),
    )
    const c = new AnilistClient(globalThis.fetch, 15_000)
    await c.getLists('Jimmy123')
    expect((body as { variables: { userName: string; type: string } }).variables.userName).toBe(
      'Jimmy123',
    )
    const { query } = body as { query: string }
    // the document must carry only the placeholder, never the username
    expect(query).not.toContain('Jimmy123')
    expect(JSON.stringify((body as { variables: unknown }).variables)).toContain('Jimmy123')
  })

  it('fetches anime and manga concurrently', async () => {
    let count = 0
    let concurrentPeak = 0
    let active = 0
    server.use(
      http.post('https://graphql.anilist.co', async () => {
        active++
        concurrentPeak = Math.max(concurrentPeak, active)
        await new Promise((r) => setTimeout(r, 20))
        active--
        count++
        return HttpResponse.json({ data: { MediaListCollection: { lists: [] } } })
      }),
    )
    const c = new AnilistClient(globalThis.fetch, 15_000)
    await c.getLists('U')
    expect(count).toBe(2)
    expect(concurrentPeak).toBe(2)
  })

  it('throws on errors[]', async () => {
    server.use(
      http.post('https://graphql.anilist.co', () =>
        HttpResponse.json({ errors: [{ message: 'boom' }] }),
      ),
    )
    const c = new AnilistClient(globalThis.fetch, 15_000)
    await expect(c.getLists('U')).rejects.toThrow(/boom/)
  })

  it('throws NotFound when null collection', async () => {
    server.use(
      http.post('https://graphql.anilist.co', () =>
        HttpResponse.json({ data: { MediaListCollection: null } }),
      ),
    )
    const c = new AnilistClient(globalThis.fetch, 15_000)
    await expect(c.getLists('UnknownUser')).rejects.toThrow(/No list for/)
  })

  it('skips idMal null and counts', async () => {
    server.use(
      http.post('https://graphql.anilist.co', () =>
        HttpResponse.json({
          data: {
            MediaListCollection: {
              lists: [
                {
                  name: 'Watching',
                  status: 'CURRENT',
                  isCustomList: false,
                  isSplitCompletedList: false,
                  entries: [
                    {
                      id: 1,
                      status: 'CURRENT',
                      score: 5,
                      progress: 1,
                      progressVolumes: null,
                      repeat: 0,
                      media: {
                        idMal: null,
                        episodes: 12,
                        chapters: null,
                        title: { romaji: 'x', english: 'x' },
                      },
                    },
                    {
                      id: 2,
                      status: 'CURRENT',
                      score: 5,
                      progress: 1,
                      progressVolumes: null,
                      repeat: 0,
                      media: {
                        idMal: 10,
                        episodes: 12,
                        chapters: null,
                        title: { romaji: 'x', english: 'x' },
                      },
                    },
                  ],
                },
              ],
            },
          },
        }),
      ),
    )
    const c = new AnilistClient(globalThis.fetch, 15_000)
    const res = await c.getLists('U')
    expect(res.anime.skippedNoMalId).toBe(1)
    expect(res.anime.list).toHaveLength(1)
    const first = res.anime.list[0]
    expect(first).toBeDefined()
    expect(first.id).toBe(10)
  })

  it('aborted before network makes zero calls', async () => {
    let called = 0
    server.use(
      http.post('https://graphql.anilist.co', () => {
        called++
        return HttpResponse.json({ data: { MediaListCollection: { lists: [] } } })
      }),
    )
    const c = new AnilistClient(globalThis.fetch, 15_000)
    const ctrl = new AbortController()
    ctrl.abort(new (await import('../../src/lib/errors.js')).CancelledError('cancelled'))
    await expect(c.getLists('U', ctrl.signal)).rejects.toThrow()
    expect(called).toBe(0)
  })
})
