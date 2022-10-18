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
	databaseSyncing?: boolean;
	slStatus: boolean;
	isAlive: boolean;
	tmiAlive?: boolean;
	slToken?: string;
	name: string;
	userId: number;
	endTime: number;
	subTime: number;
	dollarTime: number;
	lastPing: number;
}
