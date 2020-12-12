import { Stats, Media } from "./main";

export interface Cache {
	anime: {
		stats: Stats;
		list: Array<Media>;
	};
	manga: {
		stats: Stats;
		list: Array<Media>;
	};
}
