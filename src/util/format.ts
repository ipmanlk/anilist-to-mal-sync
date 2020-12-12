import { AnilistResData, FormattedAnilistResData } from "../types/anilist";
import { Cache } from "../types/cache";
import { Media } from "../types/main";
// @ts-ignore
import { toXML } from "jstoxml";

const config = require(`${process.cwd()}/config/config.json`);

export const formatResponse = (
	anilistResponse: AnilistResData,
	type: "ANIME" | "MANGA"
): FormattedAnilistResData => {
	let totPlanning = 0,
		totCurrent = 0,
		totCompleted = 0,
		totPaused = 0,
		totDropped = 0;

	let mediaEntries: Array<Media> = [];

	anilistResponse.MediaListCollection.lists.forEach((list) => {
		let status = list.name;

		switch (list.name) {
			case "Planning":
				status = type == "ANIME" ? "Plan to Watch" : "Plan to Read";
				totPlanning = list.entries.length;
				break;
			case "Completed":
				totCompleted = list.entries.length;
				break;
			case "Paused":
				status = "On-Hold";
				totPaused = list.entries.length;
				break;
			case "Dropped":
				totDropped = list.entries.length;
				break;
			case "Watching":
			case "Reading":
				totCurrent = list.entries.length;
				break;
		}

		list.entries.forEach((entry) => {
			// ignore entries without a mal id
			if (entry.media.idMal == null) return;
			mediaEntries.push({
				id: entry.media.idMal,
				length: entry.media.chapters,
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

export const getMalXML = (cache: Cache) => {
	const animeEntries = cache.anime.list.map((i) => {
		return {
			anime: {
				series_animedb_id: i.id,
				series_episodes: i.length,
				my_watched_episodes: i.progress,
				my_score: i.score,
				my_status: i.status,
				my_times_watched: i.repeat,
				update_on_import: 1,
			},
		};
	});

	// build an object for anime xml
	const animeXML = toXML(
		{
			myanimelist: [
				{
					myinfo: {
						user_id: "12345",
						user_name: config.mal.username,
						user_export_type: "1",
						user_total_anime: cache.anime.stats.total,
						user_total_watching: cache.anime.stats.current,
						user_total_completed: cache.anime.stats.completed,
						user_total_onhold: cache.anime.stats.paused,
						user_total_dropped: cache.anime.stats.dropped,
						user_total_plantowatch: cache.anime.stats.planning,
					},
				},
				...animeEntries,
			],
		},
		{
			header: true,
		}
	);

	const mangaEntries = cache.manga.list.map((i) => {
		return {
			anime: {
				manga_mangadb_id: i.id,
				manga_chapters: i.length,
				my_read_chapters: i.progress,
				my_score: i.score,
				my_status: i.status,
				my_times_read: i.repeat,
				update_on_import: 1,
			},
		};
	});

	const mangaXML = toXML(
		{
			myanimelist: [
				{
					myinfo: {
						user_id: "12345",
						user_name: config.mal.username,
						user_export_type: "2",
						user_total_manga: cache.manga.stats.total,
						user_total_reading: cache.manga.stats.current,
						user_total_completed: cache.manga.stats.completed,
						user_total_onhold: cache.manga.stats.paused,
						user_total_dropped: cache.manga.stats.dropped,
						user_total_plantoread: cache.manga.stats.planning,
					},
				},
				...mangaEntries,
			],
		},
		{
			header: true,
		}
	);

	return {
		animeXML,
		mangaXML,
	};
};
