import { describe, expect, it, vi } from 'vitest'
import { createLogger } from '../../src/lib/logger.js'
import { syncOnce } from '../../src/usecases/sync.js'
import { fakeFormattedLists, makeMedia } from '../helpers/factories.js'

function fakeMal() {
  return {
    getLists: vi.fn().mockResolvedValue({ anime: [], manga: [] }),
    updateOne: vi.fn().mockResolvedValue(undefined),
    deleteOne: vi.fn().mockResolvedValue(undefined),
  }
}
const logger = createLogger({ json: false, quiet: true, verbose: false })

describe('syncOnce', () => {
  it('dryRun does zero writes', async () => {
    const anime = [makeMedia({ type: 'anime', id: 1 })]
    const fmt = fakeFormattedLists(anime, [])
    const anilist = { getLists: vi.fn().mockResolvedValue(fmt) } as never
    const mal = fakeMal() as never
    const res = await syncOnce(
      { anilist, mal },
      {
        anilistUsername: 'U',
        prune: false,
        dryRun: true,
        concurrency: 5,
        excludes: new Set(),
        logger,
      },
    )
    expect(vi.mocked((mal as never).updateOne).mock.calls.length).toBe(0)
    expect(vi.mocked((mal as never).deleteOne).mock.calls.length).toBe(0)
    expect(res.diff.anime.update).toHaveLength(1)
  })
  it('prune false does zero deletes even with extras', async () => {
    const fmt = fakeFormattedLists([], [])
    const anilist = { getLists: vi.fn().mockResolvedValue(fmt) } as never
    const mal = {
      getLists: vi
        .fn()
        .mockResolvedValue({ anime: [makeMedia({ type: 'anime', id: 99 })], manga: [] }),
      updateOne: vi.fn().mockResolvedValue(undefined),
      deleteOne: vi.fn().mockResolvedValue(undefined),
    } as never
    await syncOnce(
      { anilist, mal },
      {
        anilistUsername: 'U',
        prune: false,
        dryRun: false,
        concurrency: 5,
        excludes: new Set(),
        logger,
      },
    )
    expect(vi.mocked((mal as never).deleteOne).mock.calls.length).toBe(0)
  })
  it('only anime excludes manga partition', async () => {
    const anime = [makeMedia({ type: 'anime', id: 1 })]
    const manga = [makeMedia({ type: 'manga', id: 101 })]
    const fmt = fakeFormattedLists(anime, manga)
    const anilist = { getLists: vi.fn().mockResolvedValue(fmt) } as never
    const mal = fakeMal() as never
    await syncOnce(
      { anilist, mal },
      {
        anilistUsername: 'U',
        prune: false,
        dryRun: false,
        concurrency: 5,
        excludes: new Set(),
        only: 'anime',
        logger,
      },
    )
    expect(vi.mocked((mal as never).updateOne).mock.calls.length).toBe(1)
    const firstCall = vi.mocked((mal as never).updateOne).mock.calls[0]
    expect(firstCall).toBeDefined()
    const arg = (firstCall as unknown[])[0] as { type: string }
    expect(arg.type).toBe('anime')
  })
  it('one rejected update among five → failed 1, others applied', async () => {
    const anime = Array.from({ length: 5 }, (_, i) => makeMedia({ type: 'anime', id: i + 1 }))
    const fmt = fakeFormattedLists(anime, [])
    const anilist = { getLists: vi.fn().mockResolvedValue(fmt) } as never
    const mal = {
      getLists: vi.fn().mockResolvedValue({ anime: [], manga: [] }),
      updateOne: vi.fn().mockImplementation(async (m: { id: number }) => {
        if (m.id === 3) throw new Error('fail 3')
      }),
      deleteOne: vi.fn().mockResolvedValue(undefined),
    } as never
    const res = await syncOnce(
      { anilist, mal },
      {
        anilistUsername: 'U',
        prune: false,
        dryRun: false,
        concurrency: 5,
        excludes: new Set(),
        logger,
      },
    )
    expect(res.failed).toHaveLength(1)
    expect(res.applied).toHaveLength(4)
  })
})
