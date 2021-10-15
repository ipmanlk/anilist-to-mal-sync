import fetch from "node-fetch";
import { existsSync, readFileSync, writeFileSync } from "fs";
import * as readline from "readline";
import * as querystring from "querystring";
import chalk from "chalk";
import { pseudoRandomBytes } from "crypto";
("crypto");

import { getConfigPaths } from "../util";

// store ongoing authentication process
const currentAuthenticator = {} as any;

export const authenticate = async () => {
	console.log(
		`${chalk.greenBright(
			"Please visit this URL and get your authentication code:"
		)} ${getAuthenticationUrl()}\n\n`
	);

	// interface to get cli inputs
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	console.log(chalk.greenBright("Enter your authentication code: "));

	// read cli input
	const it = rl[Symbol.asyncIterator]();
	const authenticationCode = await (await it.next()).value;
	rl.close();

	if (!authenticationCode || authenticationCode.length < 5) {
		console.log(chalk.redBright("Invalid authentication code!."));
		return;
	}

	generateAndSaveToken(authenticationCode)
		.then(() => {
			console.log(chalk.greenBright("Token as been generated!."));
		})
		.catch(() => {
			console.log(chalk.redBright("Failed to generate a token!."));
		});
};

export const refreshToken = async (): Promise<void> => {
	const { malTokenPath } = getConfigPaths();
	const { clientId, clientSecret } = getClientInfo();

	if (!existsSync(malTokenPath)) {
		console.log(chalk.redBright("You need to generate a token first!."));
		return;
	}

	const url = "https://myanimelist.net/v1/oauth2/token";
	const token = JSON.parse(readFileSync(malTokenPath, "utf8"));

	const options = {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		body: querystring.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: "refresh_token",
			refresh_token: token.refresh_token,
		}),
	};

	const res = await fetch(url, options);
	const data = await res.json();

	if (!data.access_token || data.access_token.length < 300) {
		console.log(data);
		throw new Error(token);
	}

	writeFileSync(malTokenPath, JSON.stringify(data));
};

const getNewCodeVerifier = () => {
	const array = pseudoRandomBytes(56 / 2);
	return Array.from(array, (dec) => {
		return ("0" + dec.toString(16)).substr(-2);
	}).join("");
};

// Request new application authorization code using a url
const getAuthenticationUrl = (): string => {
	const { clientId } = getClientInfo();
	const codeVerifier = getNewCodeVerifier();
	const codeChallenge = codeVerifier;

	currentAuthenticator["authenticator"] = {
		codeVerifier,
		codeChallenge,
	};
	return `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${clientId}&code_challenge=${codeChallenge}`;
};

// get access token using authorization code
const generateAndSaveToken = async (
	authorizationCode: string
): Promise<void> => {
	const { clientId, clientSecret } = getClientInfo();
	const { malTokenPath } = getConfigPaths();

	const url = "https://myanimelist.net/v1/oauth2/token";

	const options = {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		body: querystring.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			code: authorizationCode,
			code_verifier: currentAuthenticator["authenticator"].codeVerifier,
			grant_type: "authorization_code",
		}),
	};

	const res = await fetch(url, options);
	const data = await res.json();

	if (!data.access_token || data.access_token.length < 300) {
		console.log(data);
		throw new Error(data);
	}

	writeFileSync(malTokenPath, JSON.stringify(data));
};

const getClientInfo = () => {
	const { configFilePath } = getConfigPaths();
	const config = JSON.parse(readFileSync(configFilePath, "utf8"));
	return {
		clientId: config.mal.clientId,
		clientSecret: config.mal.clientSecret,
	};
};
