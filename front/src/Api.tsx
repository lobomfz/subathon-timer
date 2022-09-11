export function setSetting(ws: WebSocket, setting: string, value: string) {
	ws.send(
		JSON.stringify({
			event: "setSetting",
			setting: setting,
			value: value,
		})
	);
	return 1;
}

export function connectSl(ws: WebSocket, socketToken: string) {
	ws.send(
		JSON.stringify({
			event: "connectStreamlabs",
			slToken: socketToken,
		})
	);
	return 1;
}
