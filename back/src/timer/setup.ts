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

export function initializePage(ws: wsType, userId: number) {
	ws.intervals = {};

	updateLastPing(userId);

	tryToStartTmi(userId);

	tryToStartStreamlabs(userId);

	tryToPushToDb(userId);

	timeoutChecker(userId);

	frontListener(ws, userId);

	syncTimer(ws, userId);

	ws.intervals.tryToSync = setInterval(() => tryToSyncTimer(ws, userId), 1000);

	ws.intervals.updatePing = setInterval(
		() => updateLastPing(userId),
		defaultValues.keepAlivePing * 1000
	);

	ws.on("close", () => {
		ws.isAlive = false;
		closePage(ws);
	});

	return true;
}

export function closePage(ws: wsType) {
	clearInterval(ws.intervals.forceSync);
	clearInterval(ws.intervals.tryToSync);
	clearInterval(ws.intervals.updatePing);
}
