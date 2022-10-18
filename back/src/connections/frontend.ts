import { wsType } from "../types";
import { updateSetting } from "../database/interactions";
import { setEndTime, addToEndTime } from "../timer/operations";
import { getUserConfigs, userIsInCache } from "../cache/cache";
import { tryToStartStreamlabs } from "../cache/listeners";

export async function sendError(ws: wsType, message: string) {
	return ws.send(
		JSON.stringify({
			error: message,
		})
	);
}

export async function syncTimer(ws: wsType, userId: number) {
	if (!userIsInCache(userId)) return false;
	var userConfigs = await getUserConfigs(userId);

	Object.assign(ws.frontInfo, userConfigs);

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
	if (!(await userIsInCache(userId))) return false;
	var userConfigs = await getUserConfigs(userId);

	// TODO: add a way to check without having to compare all the values manually
	if (
		ws.frontInfo.endTime !== userConfigs.endTime ||
		ws.frontInfo.dollarTime !== userConfigs.dollarTime ||
		ws.frontInfo.subTime !== userConfigs.subTime ||
		ws.frontInfo.slStatus !== userConfigs.slStatus
	)
		return syncTimer(ws, userId);

	return false;
}

export function frontListener(ws: wsType, userId: number) {
	// TODO: finish this
	ws.onmessage = async function (event: any) {
		if (!(await userIsInCache(userId))) return false;
		var userConfigs = await getUserConfigs(userId);

		try {
			var data = JSON.parse(event.data);
		} catch (error) {
			sendError(ws, "json error");
			return false;
		}
		console.log(`received from ${userConfigs.name} on ${ws.page}:`, event.data);

		switch (data.event) {
			case "getTime":
				syncTimer(ws, userId);
				break;
			case "connectStreamlabs":
				if (data.slToken.length < 300) {
					updateSetting(userConfigs.userId, "slToken", data.slToken);
					tryToStartStreamlabs(userConfigs.userId);
				}
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
