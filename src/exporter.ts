import chalk from "chalk";
import { getLists } from "./api/anilistAPI";
import { writeFileSync } from "fs";
import { FormattedAnilistData } from "./types";
// @ts-ignore
import { toXML } from "jstoxml";
import { getConfigDirectory } from "./util";

export const exportLists = async () => {
	const currentDir = process.cwd();

	const anilistData = await getLists();

	const xml = getMalXML(anilistData);

	writeFileSync(`${currentDir}/anime.xml`, xml.animeXML);
	writeFileSync(`${currentDir}/manga.xml`, xml.mangaXML);
	console.log(
		chalk.green(
			`MAL Export has been completed!. Your files can be found in: ${currentDir}.`
		)
	);
};

const getMalXML = (data: FormattedAnilistData) => {
	const config = require(`${getConfigDirectory()}/config.json`);

	const animeEntries = data.anime.list.map((i) => {
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
						user_total_anime: data.anime.stats.total,
						user_total_watching: data.anime.stats.current,
						user_total_completed: data.anime.stats.completed,
						user_total_onhold: data.anime.stats.paused,
						user_total_dropped: data.anime.stats.dropped,
						user_total_plantowatch: data.anime.stats.planning,
					},
				},
				...animeEntries,
			],
		},
		{
			header: true,
		}
	);

	const mangaEntries = data.manga.list.map((i) => {
		return {
			manga: {
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
						user_total_manga: data.manga.stats.total,
						user_total_reading: data.manga.stats.current,
						user_total_completed: data.manga.stats.completed,
						user_total_onhold: data.manga.stats.paused,
						user_total_dropped: data.manga.stats.dropped,
						user_total_plantoread: data.manga.stats.planning,
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
