export type user = {
	userId: number;
	name: string;
	accessToken: string;
	sub: number;
	dollar: number;
	slToken?: string;
	timer: number;
};

export interface wsType extends WebSocket {
	timer: number;
	name: string;
	isAlive: boolean;
	sub: number;
	socket: SocketIOClient.Socket;
	slToken: string;
	dollar: number;
	slStatus: boolean;
	userId: number;
	initialized: boolean;
	accessToken: string;
	on: (event: string, listener: (data: any) => void) => void;
}
