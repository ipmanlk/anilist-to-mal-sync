#!/usr/bin/env node
import * as preferences from "./preferences";

import * as yargs from "yargs";
import * as malAuth from "./auth/malAuth";
import * as exporter from "./exporter";
import * as sync from "./sync";
import { getConfigPaths } from "./util";
import chalk from "chalk";

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
	.option("config-dir", {
		description: "Provide a custom directory for configuration files",
		type: "string",
	})
	.version(false)
	.alias("help", "h").argv;

if (argv["config-dir"]) {
	process.env.CONFIG_DIR = argv["config-dir"];
}

if (argv["set-user"]) {
	preferences.setUserInfo();
}

if (argv["set-client"]) {
	preferences.setClientInfo();
}

if (argv["login"]) {
	malAuth.authenticate();
}

if (argv["export"]) {
	exporter.exportLists();
}

if (argv["sync"]) {
	sync.syncToMal().catch((e) => console.log(e));
}

// config.syncDelay should be in minutes
if (argv["watch"]) {
	console.log(chalk.cyanBright("Press Ctrl+C to exit"));

	const { configFilePath } = getConfigPaths();
	const config = require(configFilePath);

	// initial sync
	sync.syncToMal().catch((e) => console.log(e));

	setInterval(() => {
		sync.syncToMal().catch((e) => console.log(e));
	}, config.syncDelay * 60000);
}

// check config files exists
preferences.checkConfig();
