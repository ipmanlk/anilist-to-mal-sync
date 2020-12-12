export interface Changes {
	anime: ChangeInfo;
	manga: ChangeInfo;
}

export interface ChangeInfo {
	totalChanges: number;
	update: Array<Media>;
	delete: Array<Media>;
}

export interface Media {
	id: number | null;
	length: number | null;
	progress: number;
	score: number;
	status: string;
	repeat: number;
}

export interface Stats {
	total: number;
	planning: number;
	current: number;
	completed: number;
	paused: number;
	dropped: number;
}
