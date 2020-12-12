import fetch from "node-fetch";
import { existsSync, readFileSync, writeFileSync } from "fs";
import * as readline from "readline";
import * as querystring from "querystring";
import chalk from "chalk";

const pkceChallenge = require("pkce-challenge");
const config = require(`${process.cwd()}/config/config.json`);

const tokenFilePath = `${process.cwd()}/tokens/mal.json`;

// client info from https://myanimelist.net/apiconfig
const clientId = config.mal.clientId;
const clientSecret = config.mal.clientSecret;

// store ongoing authentication process
const currentAuthenticator = {} as any;

// Generate a new Code Verifier / Code Challenge.
const getNewCodeVerifier = (): string => {
	const challenge = pkceChallenge(128);
	return challenge.code_verifier;
};

// Request new application authorization code using a url
const getAuthenticationUrl = (): string => {
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

	writeFileSync(tokenFilePath, JSON.stringify(data));
};

export const refreshToken = async (): Promise<void> => {
	if (!existsSync(tokenFilePath)) {
		console.log(chalk.redBright("You need to generate a token first!."));
		return;
	}

	const url = "https://myanimelist.net/v1/oauth2/token";
	const token = JSON.parse(readFileSync(tokenFilePath, "utf8"));

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

	writeFileSync(tokenFilePath, JSON.stringify(data));
};

export const authenticate = async () => {
	console.log(
		`${chalk.yellow(
			"Please visit this URL and get your authentication code:"
		)} ${getAuthenticationUrl()}\n\n`
	);

	console.log(chalk.yellow("Enter your authentication code: "));

	// interface to get cli inputs
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

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
			console.log(chalk.green("Token as been generated!."));
		})
		.catch(() => {
			console.log(chalk.redBright("Failed to generate a token!."));
		});
};
