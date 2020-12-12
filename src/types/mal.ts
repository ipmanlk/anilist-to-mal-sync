export type RequestType = "GET" | "POST" | "PUT" | "DELETE";

export interface RequestOptions {
	method: RequestType;
	headers: {
		Authorization: string;
		"content-type": string;
	};
	body?: string;
}
