import chalk from "chalk";
import * as yargs from "yargs";
import * as anilistApi from "./api/anilistApi";
import * as malAuth from "./auth/malAuth";
import { exportLists } from "./main/export";
import { startSync } from "./main/sync";

const config = require(`${process.cwd()}/config/config.json`);

// cli args for various actions
const argv = yargs
	.option("update", {
		alias: "u",
		description: "Update cache from AniList",
		type: "boolean",
	})
	.option("login", {
		description: "Login to MyAnimeList",
		type: "boolean",
	})
	.option("export", {
		alias: "e",
		description: "Export AniList anime & manga lists to MAL XML format",
		type: "boolean",
	})
	.option("sync", {
		description: "Sync changes made after latest cache to MAL",
		type: "boolean",
	})
	.option("watch", {
		description: "Watch for updates and sync to MAL",
		type: "boolean",
	})
	.version(false)
	.alias("help", "h").argv;

if (argv["update"]) {
	anilistApi
		.getLists()
		.then(() => {
			console.log(chalk.green("Anilist cache has been updated!."));
		})
		.catch((e) => {
			console.log(e);
		});
}

if (argv["login"]) {
	malAuth.authenticate();
}

if (argv["export"]) {
	exportLists();
}

if (argv["sync"]) {
	startSync().catch((e) => console.log(e));
}

// config.syncDelay should be in minutes
if (argv["watch"]) {
	console.log(chalk.cyanBright("Press Ctrl+C to exit"));

	// initial sync
	startSync().catch((e) => console.log(e));

	setInterval(() => {
		startSync().catch((e) => console.log(e));
	}, config.syncDelay * 60000);
}
