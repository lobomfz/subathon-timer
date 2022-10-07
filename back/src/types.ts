export type user = {
	userId: number;
	name: string;
	accessToken: string;
	subTime: number;
	dollarTime: number;
	slToken?: string;
	endTime: number;
};

export interface wsType extends WebSocket {
	page: string;
	frontInfo: any;
	isAlive: boolean;
	on: (event: string, listener: (data: any) => void) => void;
}

export interface initialUser {
	page: string;
	accessToken: string;
}

export interface userConfigsType {
	tmi?: any;
	name: string;
	userId: number;
	slToken?: string;
	slSocket?: any;
	slStatus: boolean;
	endTime: number;
	subTime: number;
	dollarTime: number;
	intervals?: any;
}
