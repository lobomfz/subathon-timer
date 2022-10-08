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
	intervals?: any;
	on: (event: string, listener: (data: any) => void) => void;
}

export interface userConfigsType {
	tmi?: any;
	pushToDb?: any;
	name: string;
	userId: number;
	slToken?: string;
	slSocket?: any;
	slStatus: boolean;
	endTime: number;
	subTime: number;
	dollarTime: number;
	isAlive: boolean;
	lastPing: number;
	timeoutChecker?: any;
	tmiAlive?: boolean;
	intervals?: any;
}
