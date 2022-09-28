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

export function addTime(
	ws: WebSocket,
	currentEndTime: number,
	seconds: number
) {
	const now = Math.trunc(new Date().getTime() / 1000);
	if (currentEndTime < now) currentEndTime = now;
	setEndTime(ws, currentEndTime + seconds);
	return 1;
}

export function setEndTime(ws: WebSocket, endTime: number) {
	console.log("trying to set end time to", endTime);
	ws.send(
		JSON.stringify({
			event: "setEndTime",
			value: endTime,
		})
	);
	return 1;
}
