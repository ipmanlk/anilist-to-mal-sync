import fetch from "node-fetch";
import {
	AnilistResponse,
	Media,
	AnilistResData,
	FormattedAnilistData,
} from "../types";
import { readFileSync } from "fs";

const excludesFilePath = `${__dirname}/../../data/excludes.json`;
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

export const getLists = async (): Promise<FormattedAnilistData> => {
	const { data: animeResData } = (await (
		await fetch("https://graphql.anilist.co", getRequestOptions("ANIME"))
	).json()) as AnilistResponse;

	const { data: mangaResData } = (await (
		await fetch("https://graphql.anilist.co", getRequestOptions("MANGA"))
	).json()) as AnilistResponse;

	const formattedAnimeData = formatAnilistResponse(animeResData);
	const formattedMangaData = formatAnilistResponse(mangaResData);

	return { anime: formattedAnimeData, manga: formattedMangaData };
};

const formatAnilistResponse = (anilistResponse: AnilistResData) => {
	let totPlanning = 0,
		totCurrent = 0,
		totCompleted = 0,
		totPaused = 0,
		totDropped = 0;

	let mediaEntries: Array<Media> = [];

	const excludesFile = JSON.parse(readFileSync(excludesFilePath, "utf8"));

	anilistResponse.MediaListCollection.lists.forEach((list) => {
		let status: any = list.name;

		switch (list.name) {
			case "Planning":
				status = "planning";
				totPlanning = list.entries.length;
				break;
			case "Completed":
				status = "completed";
				totCompleted = list.entries.length;
				break;
			case "Paused":
				status = "paused";
				totPaused = list.entries.length;
				break;
			case "Dropped":
				status = "dropped";
				totDropped = list.entries.length;
				break;
			case "Watching":
			case "Reading":
				status = "current";
				totCurrent = list.entries.length;
				break;
		}

		list.entries.forEach((entry) => {
			// ignore entries without a mal id
			if (entry.media.idMal == null || excludesFile.includes(entry.media.idMal))
				return;

			mediaEntries.push({
				id: entry.media.idMal,
				length: entry.media.chapters || entry.media.episodes || 0,
				progress: entry.progress,
				score: Math.round(entry.score),
				status: status,
				repeat: entry.repeat,
			});
		});
	});

	return {
		stats: {
			total: totPlanning + totCurrent + totCompleted + totPaused + totDropped,
			planning: totPlanning,
			current: totCurrent,
			completed: totCompleted,
			paused: totPaused,
			dropped: totDropped,
		},
		list: mediaEntries,
	};
};
