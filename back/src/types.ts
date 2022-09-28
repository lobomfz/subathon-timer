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
	endTime: number;
	name: string;
	isAlive: boolean;
	subTime: number;
	socket: SocketIOClient.Socket;
	slToken: string;
	dollarTime: number;
	slStatus: boolean;
	userId: number;
	initialized: boolean;
	accessToken: string;
	on: (event: string, listener: (data: any) => void) => void;
	type: string;
}

export interface initialUser {
	page: string;
	accessToken: string;
}

export interface currentUserType {
	page: string;
	name: string;
	intervals: any;
	endTime: number;
	subTime: number;
	dollarTime: number;
	slStatus: boolean;
	slSocket?: any;
	slToken?: string;
	userId: number;
	accessToken: string;
	send: any;
	isAlive: boolean;
}
