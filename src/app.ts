#!/usr/bin/env node
import * as preferences from "./main/preferences";
// check config file exits
preferences.checkConfig();

import chalk from "chalk";
import * as yargs from "yargs";
import * as anilistApi from "./api/anilistApi";
import * as malAuth from "./auth/malAuth";
import { exportLists } from "./main/export";
import { startSync } from "./main/sync";

const config = require(`${__dirname}/../config/config.json`);

// cli args for various actions
const argv = yargs
	.option("set-user", {
		description: "Set basic Anilist/MAL info",
		type: "boolean",
	})
	.option("set-client", {
		description: "Set basic Anilist/MAL info",
		type: "boolean",
	})
	.option("login", {
		description: "Login to MyAnimeList",
		type: "boolean",
	})
	.option("update", {
		alias: "u",
		description: "Update cache from AniList",
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

if (argv["set-user"]) {
	preferences.setUserInfo();
}

if (argv["set-client"]) {
	preferences.setClientInfo();
}

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
