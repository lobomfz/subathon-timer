export function setSetting(ws: any, setting: string, value: number) {
	ws.send(
		JSON.stringify({
			event: "setSetting",
			setting: setting,
			value: value,
		})
	);
	return 1;
}

export function connectSl(ws: any, socketToken: string) {
	ws.send(
		JSON.stringify({
			event: "connectStreamlabs",
			slToken: socketToken,
		})
	);
	return 1;
}
