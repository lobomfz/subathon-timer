export function sync(ws: WebSocket) {
	ws.send(
		JSON.stringify({
			event: "getTime",
		})
	);
	return 1;
}
export function setSetting(ws: WebSocket, setting: string, value: number) {
	ws.send(
		JSON.stringify({
			event: "setSetting",
			setting: setting,
			value: value,
		})
	);
	sync(ws);
	return 1;
}

export function connectSl(ws: WebSocket, socketToken: string) {
	ws.send(
		JSON.stringify({
			event: "connectStreamlabs",
			slToken: socketToken,
		})
	);
	sync(ws);
	return 1;
}

export function addTime(ws: WebSocket, seconds: number) {
	console.log("trying to add", seconds);
	ws.send(
		JSON.stringify({
			event: "addTime",
			value: seconds,
		})
	);
	sync(ws);
	return 1;
}

export function setTime(ws: WebSocket, seconds: number) {
	console.log("trying to set time to", seconds);
	ws.send(
		JSON.stringify({
			event: "setTime",
			value: seconds,
		})
	);
	sync(ws);
	return 1;
}
