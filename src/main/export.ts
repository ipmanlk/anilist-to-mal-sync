import chalk from "chalk";
import * as Cache from "../util/cache";
import { getLists } from "../api/anilistApi";

import { writeFileSync } from "fs";
import { getMalXML } from "../util/format";

export const exportLists = async () => {
	let cache = Cache.getData();
	if (!cache) {
		await getLists().catch((e) => console.log(e));
		cache = Cache.getData();
	}
	if (!cache) return;
	const xml = getMalXML(cache);

	const currentDir = process.cwd();

	writeFileSync(`${currentDir}/anime.xml`, xml.animeXML);
	writeFileSync(`${currentDir}/manga.xml`, xml.mangaXML);
	console.log(
		chalk.green(
			`MAL Export has been completed!. Your files can be found in: ${currentDir}.`
		)
	);
};
