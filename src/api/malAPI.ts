import fetch from "node-fetch";
import chalk from "chalk";
import * as malAuth from "../auth/malAuth";
import * as querystring from "querystring";
import { MALResponse, RequestOptions, RequestType } from "../types";
import { Media, Datum } from "../types";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { getConfigPaths } from "../util";
import { exit } from "process";

const malStatuses = {
	plan_to_watch: "planning",
	on_hold: "paused",
	watching: "current",
	dropped: "dropped",
	completed: "completed",
	plan_to_read: "planning",
	reading: "current",
} as any;

const getMalStatus = (status: string, type: "ANIME" | "MANGA") => {
	const malStatuses = {
		planning: "plan_to_watch",
		current: "watching",
		completed: "completed",
		paused: "on_hold",
		dropped: "dropped",
	} as any;
	if (type == "MANGA") {
		malStatuses["planning"] = "plan_to_read";
		malStatuses["current"] = "reading";
	}
	return malStatuses[status];
};

export const updateAnime = async (entry: Media) => {
	await sendRequest(
		`https://api.myanimelist.net/v2/anime/${entry.id}/my_list_status`,
		"PUT",
		entry.id,
		{
			status: getMalStatus(entry.status, "ANIME"),
			num_watched_episodes: entry.progress,
			score: entry.score,
		}
	);
};

export const deleteAnime = async (entry: Media) => {
	await sendRequest(
		`https://api.myanimelist.net/v2/anime/${entry.id}/my_list_status`,
		"DELETE"
	);
};

export const updateManga = async (entry: Media) => {
	await sendRequest(
		`https://api.myanimelist.net/v2/manga/${entry.id}/my_list_status`,
		"PUT",
		entry.id,
		{
			status: getMalStatus(entry.status, "MANGA"),
			num_chapters_read: entry.progress,
			score: entry.score,
		}
	);
};

export const deleteManga = async (entry: Media) => {
	await sendRequest(
		`https://api.myanimelist.net/v2/manga/${entry.id}/my_list_status`,
		"DELETE"
	);
};

export const getLists = async () => {
	let animeList = [] as any;
	let mangaList = [] as any;

	const getAnimeData = async (offset: number = 0) => {
		let response: MALResponse = (await sendRequest(
			`https://api.myanimelist.net/v2/users/@me/animelist?fields=list_status&limit=1000&offset=${offset}&nsfw=true`,
			"GET"
		)) as MALResponse;

		animeList = [...animeList, ...response.data];

		if (response.data.length != 0) {
			await getAnimeData(offset + response.data.length);
		}
	};

	const getMangaData = async (offset: number = 0) => {
		let response: MALResponse = (await sendRequest(
			`https://api.myanimelist.net/v2/users/@me/mangalist?fields=list_status&limit=1000&offset=${offset}&nsfw=true`,
			"GET"
		)) as MALResponse;

		mangaList = [...mangaList, ...response.data];

		if (response.data.length != 0) {
			await getMangaData(offset + response.data.length);
		}
	};

	await getAnimeData();
	await getMangaData();

	const formattedAnimeList: Array<Media> = [];
	animeList.forEach((i: Datum) => {
		formattedAnimeList.push({
			id: i.node.id,
			progress: i.list_status.num_episodes_watched || 0,
			score: i.list_status.score,
			status: malStatuses[i.list_status.status],
		});
	});

	const formattedMangaList: Array<Media> = [];
	mangaList.forEach((i: Datum) => {
		formattedMangaList.push({
			id: i.node.id,
			progress: i.list_status.num_chapters_read || 0,
			score: i.list_status.score,
			status: malStatuses[i.list_status.status],
		});
	});

	return {
		anime: formattedAnimeList,
		manga: formattedMangaList,
	};
};

const sendRequest = async (
	url: string,
	type: RequestType,
	mediaId: number | undefined = undefined,
	data: any = {}
) => {
	const { malTokenPath, excludesFilePath } = getConfigPaths();

	if (!existsSync(malTokenPath)) {
		console.log(chalk.redBright("Please login to MAL first."));
		exit();
	}

	const token = JSON.parse(readFileSync(malTokenPath, "utf8"));

	const excludesFile = JSON.parse(readFileSync(excludesFilePath, "utf8"));

	const requestOptions: RequestOptions = {
		method: type,
		headers: {
			Authorization: `Bearer ${token.access_token}`,
			"content-type": "application/x-www-form-urlencoded",
		},
		body: querystring.stringify(data),
	};

	// remove body if request type is GET or DELETE
	if (type == "GET" || type == "DELETE") delete requestOptions.body;

	const res = await fetch(url, requestOptions);

	if (res.status == 401) {
		await malAuth.refreshToken();
		await sendRequest(url, type, mediaId, data);
		return;
	}

	const resData = await res.json();

	if (res.status == 200) {
		return resData;
	}

	if (mediaId) {
		excludesFile.push(mediaId);
		writeFileSync(excludesFilePath, JSON.stringify(excludesFile));
	}

	throw new Error(resData);
};
