import { wsType } from "../types";
import { getUserConfigs, updateSettings, userConfig } from "../cache/cache";
import { tryToStartStreamlabs } from "../cache/listeners";
import { wss } from "../index";

export async function sendError(ws: wsType, message: string) {
	return ws.send(
		JSON.stringify({
			error: message,
		})
	);
}

export function isFrontSynced(frontInfo: any, backInfo: any) {
	if (!("endTime" in frontInfo)) return false;

	// this avoids sending irrelevant data to front but it's still called a lot, so
	// TODO: reduce redundant calls (mainly on user login)

	for (const [key, value] of Object.entries(frontInfo)) {
		if (key in backInfo && backInfo[key] != value) {
			return false;
		}
	}
	return true;
}

export async function sendToUser(userId: number, data: any, backInfo: any) {
	wss.clients.forEach(function each(ws: any) {
		if (ws.userId == userId) {
			if (isFrontSynced(ws.frontInfo, data)) return false;

			console.trace("updating sync");
			Object.assign(ws.frontInfo, backInfo);
			ws.send(JSON.stringify(data));
		}
	});
}

export async function syncTimer(userId: number) {
	if (!userConfig.has(userId)) return false;
	let userConfigs = getUserConfigs(userId);

	sendToUser(
		userId,
		{
			success: true,
			endTime: userConfigs.endTime,
			subTime: userConfigs.subTime,
			dollarTime: userConfigs.dollarTime,
			slStatus: userConfigs.slStatus,
		},
		userConfigs
	);

	return true;
}

export function frontListener(ws: wsType, userId: number) {
	ws.onmessage = function (event: any) {
		if (!userConfig.has(userId)) return false;
		var userConfigs = getUserConfigs(userId);

		try {
			var data = JSON.parse(event.data);
		} catch (error) {
			sendError(ws, "json error");
			return false;
		}
		console.log(`received from ${userConfigs.name} on ${ws.page}:`, event.data);

		switch (data.event) {
			case "getTime":
				syncTimer(userId);
				break;
			case "connectStreamlabs":
				if (data.slToken.length < 300) {
					updateSettings(userConfigs.userId, data);
					tryToStartStreamlabs(userConfigs.userId);
				}
				break;
			case "setSettings":
			case "setEndTime":
				updateSettings(userConfigs.userId, data);
				break;
		}
	};
}
