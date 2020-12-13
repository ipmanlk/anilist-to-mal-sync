import fetch from "node-fetch";
import { formatResponse } from "../util/format";
import * as Cache from "../util/cache";
import { AnilistRes } from "../types/anilist";

const config = require(`${__dirname}/../../config/config.json`);

const getRequestOptions = (type: "ANIME" | "MANGA") => {
	const query = `query {
    MediaListCollection(userName: "${config.anilist.username}", type: ${type}) {
      lists {
        entries {
          id
          status
          score(format: POINT_10)
          progress
          notes
          repeat
          media {
            chapters
            volumes
            idMal
            episodes
            title { romaji }
          }
        }
        name
        isCustomList
        isSplitCompletedList
        status
      }
    }
  }`;

	return {
		method: "post",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			query,
		}),
	};
};

export const getLists = async () => {
	const { data: animeResData } = (await (
		await fetch("https://graphql.anilist.co", getRequestOptions("ANIME"))
	).json()) as AnilistRes;

	const { data: mangaResData } = (await (
		await fetch("https://graphql.anilist.co", getRequestOptions("MANGA"))
	).json()) as AnilistRes;

	const newAnime = formatResponse(animeResData, "ANIME");
	const newManga = formatResponse(mangaResData, "MANGA");

	Cache.saveData({
		anime: newAnime,
		manga: newManga,
	});
};
