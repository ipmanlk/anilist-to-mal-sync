export const MEDIA_LIST_COLLECTION = `
query MediaListCollection($userName: String!, $type: MediaType!) {
  MediaListCollection(userName: $userName, type: $type) {
    lists {
      name
      isCustomList
      isSplitCompletedList
      status
      entries {
        id
        status
        score(format: POINT_10)
        progress
        progressVolumes
        repeat
        media {
          idMal
          episodes
          chapters
          title { romaji english }
        }
      }
    }
  }
}` as const
