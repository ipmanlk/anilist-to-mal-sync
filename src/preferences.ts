import * as readline from "readline";
import chalk from "chalk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { getConfigDirectory } from "./util";

const configDirectory = getConfigDirectory();
const configFilePath = `${configDirectory}/config.json`;
const excludesFilePath = `${configDirectory}/excludes.json`;

export const setUserInfo = async () => {
	checkConfig();
	// interface to get cli inputs
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const it = rl[Symbol.asyncIterator]();

	console.log(chalk.greenBright("Enter your AniList Username: "));
	const anilistUsername = await (await it.next()).value;

	if (!anilistUsername || anilistUsername.trim() == "") {
		console.log(chalk.redBright("Anilist username can't be empty!."));
		rl.close();
		return;
	}

	console.log(chalk.greenBright("Enter your MAL Username: "));
	const malUsername = await (await it.next()).value;

	if (!malUsername || malUsername.trim() == "") {
		console.log(chalk.redBright("Anilist username can't be empty!."));
		rl.close();
		return;
	}

	const config = JSON.parse(readFileSync(configFilePath, "utf8"));
	config.anilist.username = anilistUsername;
	config.mal.username = malUsername;

	writeFileSync(configFilePath, JSON.stringify(config));

	rl.close();
	console.log(chalk.greenBright("User has been configured!."));
};

export const setClientInfo = async () => {
	checkConfig();
	// interface to get cli inputs
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const it = rl[Symbol.asyncIterator]();

	console.log(chalk.greenBright("Enter your MAL Client ID: "));
	const clientId = await (await it.next()).value;

	if (!clientId || clientId.trim() == "") {
		console.log(chalk.redBright("Client ID can't be empty!"));
		rl.close();
		return;
	}

	console.log(chalk.greenBright("Enter your MAL Client Secret: "));
	const clientSecret = await (await it.next()).value;

	if (!clientSecret || clientSecret.trim() == "") {
		console.log(chalk.redBright("Client Secret can't be empty!."));
		rl.close();
		return;
	}

	const config = JSON.parse(readFileSync(configFilePath, "utf8"));
	config.mal.clientId = clientId;
	config.mal.clientSecret = clientSecret;

	writeFileSync(configFilePath, JSON.stringify(config));

	rl.close();
	console.log(chalk.greenBright("MAL Client has been configured!."));
};

export const checkConfig = () => {
	if (!existsSync(configDirectory)) {
		mkdirSync(configDirectory);
	}

	if (!existsSync(configFilePath)) {
		writeFileSync(
			configFilePath,
			JSON.stringify({
				anilist: {
					username: "",
				},
				mal: {
					username: "",
					clientId: "",
					clientSecret: "",
				},
				syncDelay: 30,
			})
		);
	}

	if (!existsSync(excludesFilePath)) {
		writeFileSync(excludesFilePath, "[]");
	}
};
