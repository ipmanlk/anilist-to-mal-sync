import { abortableDelay } from '../lib/signal.js'
import type { AnilistPort } from '../ports/anilist.js'
import type { MalPort } from '../ports/mal.js'
import type { SyncOptions } from './sync.js'
import { syncOnce } from './sync.js'

export async function watchLoop(
  deps: { anilist: AnilistPort; mal: MalPort },
  opts: SyncOptions & { intervalMs: number },
  signal: AbortSignal,
): Promise<void> {
  for (;;) {
    signal.throwIfAborted()
    const result = await syncOnce(deps, opts, signal)
    if (result.failed.length > 0) {
      opts.logger.warn(`${result.failed.length} items failed; will retry next tick`)
    }
    if (opts.intervalMs === 0) return
    await abortableDelay(opts.intervalMs, signal)
    if (signal.aborted) return
  }
}
