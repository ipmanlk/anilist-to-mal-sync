import chalk from "chalk";
import * as anilistAPI from "./api/anilistAPI";
import * as malAPI from "./api/malAPI";
import { Changes, Media } from "./types";

const getChanges = async () => {
	const aniEntries = await anilistAPI.getLists();
	const malEntires = await malAPI.getLists();

	// object to hold changes
	const changes: Changes = {
		anime: {
			totalChanges: 0,
			update: [],
			delete: [],
		},
		manga: {
			totalChanges: 0,
			update: [],
			delete: [],
		},
	};

	aniEntries.anime.list.forEach((a: Media) => {
		const malEntry = malEntires.anime.find((i) => i.id == a.id);
		// change score to int if decimal
		a.score = Math.round(a.score);
		if (
			!malEntry ||
			a.status != malEntry.status ||
			a.progress != malEntry.progress ||
			a.score != malEntry.score
		) {
			changes.anime.totalChanges += 1;
			changes.anime.update.push(a);
		}
	});

	malEntires.anime.forEach((a: Media) => {
		const aniEntry = aniEntries.anime.list.find((i) => i.id == a.id);
		if (aniEntry) return;
		changes.anime.totalChanges += 1;
		changes.anime.delete.push(a);
	});

	aniEntries.manga.list.forEach((a: Media) => {
		const malEntry = malEntires.manga.find((i) => i.id == a.id);
		// change score to int if decimal
		a.score = Math.round(a.score);
		if (
			!malEntry ||
			a.status != malEntry.status ||
			a.progress != malEntry.progress ||
			a.score != malEntry.score
		) {
			changes.manga.totalChanges += 1;
			changes.manga.update.push(a);
		}
	});

	malEntires.manga.forEach((a: Media) => {
		const aniEntry = aniEntries.manga.list.find((i) => i.id == a.id);
		if (aniEntry) return;
		changes.manga.totalChanges += 1;
		changes.manga.delete.push(a);
	});

	return changes;
};

const syncChanges = async (changes: Changes) => {
	for (let change of changes.anime.update) {
		await malAPI.updateAnime(change).catch((e) => {
			console.log(e, change);
		});
	}

	for (let change of changes.anime.delete) {
		await malAPI.deleteAnime(change).catch((e) => {
			console.log(e, change);
		});
	}

	for (let change of changes.manga.update) {
		await malAPI.updateManga(change).catch((e) => {
			console.log(e, change);
		});
	}

	for (let change of changes.manga.delete) {
		await malAPI.deleteManga(change).catch((e) => {
			console.log(e, change);
		});
	}
};

export const syncToMal = async () => {
	console.log(chalk.greenBright("Retrieving Anillist updates..."));

	const changes = await getChanges();
	const totalUpdates = changes.anime.totalChanges + changes.manga.totalChanges;

	if (totalUpdates > 0) {
		console.log(chalk.yellow("Total updates: ", totalUpdates));
		console.log(chalk.greenBright("Syncing changes..."));
		await syncChanges(changes);
		console.log(chalk.greenBright("Syncing completed."));
	} else {
		console.log(chalk.greenBright("No new updates found."));
	}
};
