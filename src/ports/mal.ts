import type { Media } from '../domain/media.js'

export interface MalPort {
  getLists(signal?: AbortSignal): Promise<{ anime: Media[]; manga: Media[] }>
  updateOne(media: Media, signal?: AbortSignal): Promise<void>
  deleteOne(media: Media, signal?: AbortSignal): Promise<void>
}
