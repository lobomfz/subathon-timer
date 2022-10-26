export function setSettings(ws: WebSocket, settings: any) {
	settings.event = "setSettings";
	ws.send(JSON.stringify(settings));
}

export function connectSl(ws: WebSocket, socketToken: string) {
	ws.send(
		JSON.stringify({
			event: "connectStreamlabs",
			slToken: socketToken,
		})
	);
}

export function addTime(
	ws: WebSocket,
	secondsToAdd: number,
	currentEndTime: number
) {
	const now = Math.trunc(Date.now() / 1000);

	if (currentEndTime < now) currentEndTime = now;

	setEndTime(ws, currentEndTime + secondsToAdd);
}

export function setEndTime(ws: WebSocket, endTime: number) {
	setSettings(ws, { endTime: endTime });
}
