import type { FormattedLists } from '../domain/media.js'

export interface AnilistPort {
  getLists(username: string, signal?: AbortSignal): Promise<FormattedLists>
}
