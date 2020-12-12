import { readFileSync, writeFileSync, existsSync } from "fs";
import { Cache } from "../types/cache";

const cacheFilePath = `${process.cwd()}/cache/cache.json`;

export const saveData = (data: Cache) => {
	writeFileSync(cacheFilePath, JSON.stringify(data));
};

export const getData = (): Cache | false => {
	if (!existsSync(cacheFilePath)) {
		return false;
	} else {
		return JSON.parse(readFileSync(cacheFilePath, "utf8")) as Cache;
	}
};
