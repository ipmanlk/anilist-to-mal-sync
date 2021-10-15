import { platform, homedir } from "os";

export const getConfigPaths = () => {
	const configDirectoryPath = getConfigDirectoryPath();
	const configFilePath = `${configDirectoryPath}/config.json`;
	const excludesFilePath = `${configDirectoryPath}/excludes.json`;
	const malTokenPath = `${configDirectoryPath}/mal_token.json`;
	return {
		configDirectoryPath,
		configFilePath,
		excludesFilePath,
		malTokenPath,
	};
};

const getConfigDirectoryPath = () => {
	if (process.env.CONFIG_DIR) {
		return process.env.CONFIG_DIR;
	}
	if (platform() == "win32") {
		return process.env.APPDATA + "/ani2mal";
	} else {
		return homedir() + "/.config/ani2mal";
	}
};
