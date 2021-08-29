import { platform, homedir } from "os";

export const getConfigDirectory = () => {
	if (platform() == "win32") {
		return homedir() + "/ani2mal";
	} else {
		return homedir() + "/.config/ani2mal";
	}
};
