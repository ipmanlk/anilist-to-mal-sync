import { describe, expect, it, vi } from 'vitest'
import { createLogger } from '../../src/lib/logger.js'
import { watchLoop } from '../../src/usecases/watch.js'
import { fakeFormattedLists } from '../helpers/factories.js'

const logger = createLogger({ json: false, quiet: true, verbose: false })

describe('watchLoop', () => {
  it('interval 0 runs exactly once', async () => {
    const fmt = fakeFormattedLists([], [])
    const anilist = { getLists: vi.fn().mockResolvedValue(fmt) } as never
    const mal = {
      getLists: vi.fn().mockResolvedValue({ anime: [], manga: [] }),
      updateOne: vi.fn().mockResolvedValue(undefined),
      deleteOne: vi.fn().mockResolvedValue(undefined),
    } as never
    const signal = new AbortController().signal
    await watchLoop(
      { anilist, mal },
      {
        anilistUsername: 'U',
        prune: false,
        dryRun: false,
        concurrency: 5,
        excludes: new Set(),
        logger,
        intervalMs: 0,
      },
      signal,
    )
    expect(anilist.getLists).toHaveBeenCalledTimes(1)
  })
  it('pre-aborted signal does zero iterations', async () => {
    const fmt = fakeFormattedLists([], [])
    const anilist = { getLists: vi.fn().mockResolvedValue(fmt) } as never
    const mal = {
      getLists: vi.fn().mockResolvedValue({ anime: [], manga: [] }),
      updateOne: vi.fn().mockResolvedValue(undefined),
      deleteOne: vi.fn().mockResolvedValue(undefined),
    } as never
    const c = new AbortController()
    c.abort()
    await expect(
      watchLoop(
        { anilist, mal },
        {
          anilistUsername: 'U',
          prune: false,
          dryRun: false,
          concurrency: 5,
          excludes: new Set(),
          logger,
          intervalMs: 1000,
        },
        c.signal,
      ),
    ).rejects.toThrow()
    expect(anilist.getLists).not.toHaveBeenCalled()
  })
  it('abort during sleep resolves before next tick', async () => {
    const fmt = fakeFormattedLists([], [])
    const anilist = { getLists: vi.fn().mockResolvedValue(fmt) } as never
    const mal = {
      getLists: vi.fn().mockResolvedValue({ anime: [], manga: [] }),
      updateOne: vi.fn().mockResolvedValue(undefined),
      deleteOne: vi.fn().mockResolvedValue(undefined),
    } as never
    const c = new AbortController()
    const p = watchLoop(
      { anilist, mal },
      {
        anilistUsername: 'U',
        prune: false,
        dryRun: false,
        concurrency: 5,
        excludes: new Set(),
        logger,
        intervalMs: 5000,
      },
      c.signal,
    )
    // after first tick, it will sleep 5000ms; abort after 20ms
    setTimeout(() => c.abort(), 20)
    await p
    expect(anilist.getLists).toHaveBeenCalledTimes(1)
  })
})
