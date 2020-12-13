import chalk from "chalk";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { ChangeInfo, Changes, Media } from "../types/main";
import { Cache } from "../types/cache";
import { getData } from "../util/cache";
import * as anilistApi from "../api/anilistApi";
import * as malApi from "../api/malApi";

const changesFilePath = `${__dirname}/../../cache/changes.json`;

export const startSync = async () => {
	const oldCache = getData();
	// update cache
	await anilistApi.getLists();

	if (!oldCache) return;

	const newCache = getData();
	if (!newCache) return;

	// check if there are changes left to sync
	if (existsSync(changesFilePath)) {
		console.log(chalk.yellow("Sync: checking for leftover changes"));
		const cachedChanges = JSON.parse(readFileSync(changesFilePath, "utf-8"));
		await syncToMal(cachedChanges.changes);
	}

	console.log(chalk.yellow("Sync: checking for new changes"));
	const changes = getChanges(oldCache, newCache);
	await syncToMal(changes);
};

const syncToMal = async (changes: Changes) => {
	if (changes.anime.totalChanges == 0 && changes.manga.totalChanges == 0)
		return;

	// sync anime
	for (let entry of changes.anime.update) {
		console.log(chalk.yellow("Sync: updating anime"));
		await malApi.updateAnime(entry);
	}

	for (let entry of changes.anime.delete) {
		console.log(chalk.yellow("Sync: deleting anime"));
		await malApi.deleteAnime(entry);
	}

	// sync manga
	for (let entry of changes.manga.update) {
		console.log(chalk.yellow("Sync: updating manga"));
		await malApi.updateManga(entry);
	}

	for (let entry of changes.manga.delete) {
		console.log(chalk.yellow("Sync: deleting manga"));
		await malApi.deleteManga(entry);
	}

	console.log(chalk.green("Sync: changes successfully synced"));
};

const getChanges = (oldCache: Cache, newCache: Cache) => {
	const changes = {
		anime: {} as ChangeInfo,
		manga: {} as ChangeInfo,
	} as Changes;

	// anime changes
	const { updated: updatedAnime, deleted: deletedAnime } = getChangedEntries(
		oldCache.anime.list,
		newCache.anime.list
	);

	changes.anime.totalChanges = updatedAnime.length + deletedAnime.length;
	changes.anime.update = updatedAnime;
	changes.anime.delete = deletedAnime;

	// manga changes
	const { updated: updatedManga, deleted: deletedManga } = getChangedEntries(
		oldCache.manga.list,
		newCache.manga.list
	);

	changes.manga.totalChanges = updatedManga.length + deletedManga.length;
	changes.manga.update = updatedManga;
	changes.manga.delete = deletedManga;

	// write changes to cache
	writeFileSync(changesFilePath, JSON.stringify({ changes }));

	return changes;
};

const getChangedEntries = (oldList: Array<Media>, newList: Array<Media>) => {
	const changes = {
		deleted: [] as Array<Media>,
		updated: [] as Array<Media>,
	};

	// newly added entries
	newList.forEach((i) => {
		const oldEntry = oldList.find((m) => m.id == i.id);
		if (!oldEntry) changes.updated.push(i);
	});

	// updated and deleted entries
	oldList.forEach((i) => {
		const newEntry = newList.find((m) => m.id == i.id);
		if (!newEntry) {
			changes.deleted.push(i);
			return;
		}

		if (JSON.stringify(newEntry) != JSON.stringify(i)) {
			changes.updated.push(newEntry);
		}
	});

	return changes;
};
