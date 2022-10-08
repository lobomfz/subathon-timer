import { userConfigsType, wsType } from "../types";
import { defaultValues } from "../config/userSettings";
import { syncTimer, tryToSyncTimer } from "../connections/frontend";
import {
	tryToStartTmi,
	tryToStartStreamlabs,
	tryToPushToDb,
	timeoutChecker,
} from "../cache/listeners";
import { frontListener } from "../connections/frontend";
import { updateLastPing } from "../timeout/timeout";

export function initializePage(ws: wsType, userConfigs: userConfigsType) {
	ws.intervals = {};

	updateLastPing(userConfigs.userId);

	tryToStartTmi(userConfigs.userId);

	tryToStartStreamlabs(userConfigs.userId);

	tryToPushToDb(userConfigs.userId);

	timeoutChecker(userConfigs.userId);

	frontListener(ws, userConfigs.userId);

	syncTimer(ws, userConfigs.userId);

	ws.intervals.forceSync = setInterval(
		() => syncTimer(ws, userConfigs.userId),
		defaultValues.forceSync * 1000
	);

	ws.intervals.tryToSync = setInterval(
		() => tryToSyncTimer(ws, userConfigs.userId),
		1000
	);

	ws.intervals.updatePing = setInterval(
		() => updateLastPing(userConfigs.userId),
		defaultValues.keepAlivePing * 1000
	);

	ws.on("close", () => {
		ws.isAlive = false;
		closePage(ws);
	});
}

export function closePage(ws: wsType) {
	clearInterval(ws.intervals.forceSync);
	clearInterval(ws.intervals.tryToSync);
	clearInterval(ws.intervals.updatePing);
}
