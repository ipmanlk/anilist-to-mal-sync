// changes happening between anilist and mal
export interface Changes {
	anime: ChangeInfo;
	manga: ChangeInfo;
}

export interface ChangeInfo {
	totalChanges: number;
	update: Array<Media>;
	delete: Array<Media>;
}

// general format to store anime / manga
export interface Media {
	id: number;
	length?: number;
	progress: number;
	score: number;
	status: "panning" | "current" | "completed" | "paused" | "dropped";
	repeat?: number;
}

// stats is needed for mal XML export
export interface Stats {
	total: number;
	planning: number;
	current: number;
	completed: number;
	paused: number;
	dropped: number;
}

export interface FormattedAnilistData {
	anime: {
		stats: Stats;
		list: Media[];
	};
	manga: {
		stats: Stats;
		list: Media[];
	};
}

// data from mal / anilist api should be in this format
export interface FormattedResData {
	stats: Stats;
	list: Array<Media>;
}

// mal api response
export interface MALResponse {
	data: Datum[];
	paging?: Paging;
}

export interface Datum {
	node: Node;
	list_status: ListStatus;
}

export interface ListStatus {
	status: string;
	score: number;
	num_episodes_watched?: number;
	num_chapters_read?: number;
	is_rewatching: boolean;
	updated_at: string;
}

export interface Node {
	id: number;
	title: string;
	main_picture: MainPicture;
}

export interface MainPicture {
	medium: string;
	large: string;
}

export interface Paging {
	next: string;
}

// anilist api response
export interface AnilistResponse {
	data: AnilistResData;
}

export interface AnilistResData {
	MediaListCollection: MediaListCollection;
}

export interface MediaListCollection {
	lists: List[];
}

export interface List {
	entries: Entry[];
	name: string;
	isCustomList: boolean;
	isSplitCompletedList: boolean;
	status: string;
}

export interface Entry {
	id: number;
	status: string;
	score: number;
	progress: number;
	notes: string | null;
	repeat: number;
	media: AnilistMedia;
}

export interface AnilistMedia {
	chapters: number | null;
	volumes: number | null;
	idMal: number | null;
	episodes: number | null;
	title: Title;
}

export interface Title {
	romaji: string;
}

// api requests
export type RequestType = "GET" | "POST" | "PUT" | "DELETE";

export interface RequestOptions {
	method: RequestType;
	headers: {
		Authorization: string;
		"content-type": string;
	};
	body?: string;
}
