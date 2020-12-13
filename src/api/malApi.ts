import fetch from "node-fetch";
import * as malAuth from "../auth/malAuth";
import * as querystring from "querystring";
import { readFileSync } from "fs";
import { RequestOptions, RequestType } from "../types/mal";
import { Media } from "../types/main";

const malStatuses = {
	"Plan to Watch": "plan_to_watch",
	"On-Hold": "on_hold",
	Watching: "watching",
	Dropped: "dropped",
	Completed: "completed",
	"Plan to Read": "plan_to_read",
	Reading: "reading",
} as any;

export const updateAnime = async (entry: Media) => {
	await sendRequest(
		`https://api.myanimelist.net/v2/anime/${entry.id}/my_list_status`,
		"PUT",
		{
			status: malStatuses[entry.status],
			num_watched_episodes: entry.progress,
			num_times_rewatched: entry.repeat,
			score: entry.score,
		}
	);
};

export const deleteAnime = async (entry: Media) => {
	await sendRequest(`/anime/${entry.id}/my_list_status`, "DELETE");
};

export const updateManga = async (entry: Media) => {
	await sendRequest(
		`https://api.myanimelist.net/v2/manga/${entry.id}/my_list_status`,
		"PUT",
		{
			status: malStatuses[entry.status],
			num_chapters_read: entry.progress,
			num_times_reread: entry.repeat,
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

const sendRequest = async (url: string, type: RequestType, data: any = {}) => {
	const token = JSON.parse(
		readFileSync(`${__dirname}/../../tokens/mal.json`, "utf8")
	);

	// test api to see if token has expired
	const testRes = await fetch("https://api.myanimelist.net/v2/users/@me", {
		headers: {
			Authorization: `Bearer ${token.access_token}`,
		},
	});

	if (testRes.status == 401) {
		await malAuth.refreshToken();
	}

	// options for making the request
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
	const resData = await res.json();

	if (res.status == 200) {
		return true;
	} else {
		throw resData;
	}
};
