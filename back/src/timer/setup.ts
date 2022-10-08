import { userConfigsType, wsType } from "../types";
import { defaultValues } from "../config/userSettings";
import { syncTimer, tryToSyncTimer } from "../connections/frontend";
import { tryToStartTmi, tryToStartStreamlabs } from "../cache/listeners";
import { frontListener } from "../connections/frontend";
import { pushToDb } from "../database/interactions";

export function initializePage(ws: wsType, userConfigs: userConfigsType) {
	userConfigs.intervals = {};

	tryToStartTmi(userConfigs.userId);

	tryToStartStreamlabs(userConfigs.userId);

	frontListener(ws, userConfigs.userId);

	syncTimer(ws, userConfigs.userId);

	userConfigs.intervals.forceSync = setInterval(
		() => syncTimer(ws, userConfigs.userId),
		defaultValues.forceSync * 1000
	);

	// TODO: transfer pushToDb function to cache (like tmi)
	userConfigs.intervals.pushToDb = setInterval(
		() => pushToDb(userConfigs.userId),
		1000
	);

	userConfigs.intervals.tryToSync = setInterval(
		() => tryToSyncTimer(ws, userConfigs.userId),
		1000
	);

	ws.on("close", () => {
		ws.isAlive = false;
		closePage(userConfigs);
	});
}

export function closePage(userConfigs: userConfigsType) {
	clearInterval(userConfigs.intervals.forceSync);
	clearInterval(userConfigs.intervals.pushToDb);
	clearInterval(userConfigs.intervals.tryToSync);
}
