import { wsType } from "../types";
import { updateSetting } from "../database/interactions";
import { setEndTime, addToEndTime } from "../timer/operations";
import { getUserConfigs, userConfig } from "../cache/cache";

export async function sendError(ws: wsType, message: string) {
	return ws.send(
		JSON.stringify({
			error: message,
		})
	);
}

export async function syncTimer(ws: wsType, userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	Object.assign(ws.frontInfo, userConfigs);

	console.log(
		`trying to send to ${userConfigs.name} on ${ws.page} endtime: ${userConfigs.endTime}`
	);

	ws.send(
		JSON.stringify({
			success: true,
			endTime: userConfigs.endTime,
			subTime: userConfigs.subTime,
			dollarTime: userConfigs.dollarTime,
			slStatus: userConfigs.slStatus,
		})
	);
	return true;
}

// checks if frontend is synced, if not, syncs.
export async function tryToSyncTimer(ws: wsType, userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	// TODO: add a way to check without having to compare all the values manually
	if (
		ws.frontInfo.endTime !== userConfigs.endTime ||
		ws.frontInfo.dollarTime !== userConfigs.dollarTime ||
		ws.frontInfo.subTime !== userConfigs.subTime
	) {
		console.log("desynced, syncing");
		return syncTimer(ws, userId);
	}
	return false;
}

export function frontListener(ws: wsType, userId: number) {
	// TODO: this whole shit
	ws.onmessage = function (event: any) {
		if (!userConfig.has(userId)) return false;
		var userConfigs = getUserConfigs(userId);

		try {
			var data = JSON.parse(event.data);
		} catch (error) {
			sendError(ws, "json error");
			return false;
		}
		console.log(
			`received from ${userConfigs.name} on ${ws.page}:`,
			JSON.stringify(event.data)
		);

		switch (data.event) {
			case "getTime":
				// syncTimer(currentUser);
				break;
			case "connectStreamlabs":
				if (data.slToken.length < 300) userConfigs.slToken = data.slToken;
				//connectStreamlabs(currentUser);
				break;
			case "setSetting":
				updateSetting(userConfigs.userId, data.setting, data.value);
				break;
			case "setEndTime":
				if (data.value) setEndTime(userConfigs.userId, data.value);
				break;
			case "addTime":
				if (data.value) addToEndTime(userConfigs.userId, data.value);
				break;
		}
		syncTimer(ws, userId);
	};
}
