import chalk from "chalk";
import * as Cache from "../util/cache";
import { getLists } from "../api/anilistApi";

import { writeFileSync } from "fs";
import { getMalXML } from "../util/format";

const exportDir = `${__dirname}/../../exports`;

export const exportLists = async () => {
	let cache = Cache.getData();

	if (!cache) {
		await getLists().catch((e) => console.log(e));
		cache = Cache.getData();
	}

	if (!cache) return;

	const xml = getMalXML(cache);
	writeFileSync(`${exportDir}/anime.xml`, xml.animeXML);
	writeFileSync(`${exportDir}/manga.xml`, xml.mangaXML);

	console.log(chalk.green("MAL Export has been completed!."));
};
