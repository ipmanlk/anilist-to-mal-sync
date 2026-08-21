import {
  type AniStatus,
  type Media,
  type MediaType,
  malId,
  scoreOf,
} from '../../src/domain/media.js'

export function makeMedia(over: Partial<Media> & { type: MediaType; id: number }): Media {
  const base = {
    type: over.type,
    id: malId(over.id),
    progress: over.progress ?? 0,
    score: over.score !== undefined ? scoreOf(over.score as unknown as number) : scoreOf(0),
    status: (over.status ?? 'current') as AniStatus,
    repeat: over.repeat ?? 0,
    length: over.length ?? null,
  }
  return base as Media
}

export function fakeFormattedLists(anime: Media[] = [], manga: Media[] = []) {
  const mk = (list: Media[]) => ({
    list,
    stats: {
      total: list.length,
      planning: 0,
      current: list.length,
      completed: 0,
      paused: 0,
      dropped: 0,
    },
    skippedNoMalId: 0,
  })
  return { anime: mk(anime), manga: mk(manga) }
}
