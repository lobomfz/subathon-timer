import { currentUserType, userConfigsType, wsType } from "../types";
import { defaultValues } from "../config/userSettings";
import { syncTimer, syncFromDb } from "../connections/frontend";
import { tryToStartTmi, tryToStartStreamlabs } from "../cache/listeners";
import { frontListener } from "../connections/frontend";

export function initializePage(ws: wsType, userConfigs: userConfigsType) {
	tryToStartTmi(userConfigs.userId);

	tryToStartStreamlabs(userConfigs.userId);

	frontListener(ws, userConfigs.userId);

	syncTimer(ws, userConfigs.userId);

	userConfigs.intervals.forceSync = setInterval(
		() => syncTimer(ws, userConfigs.userId),
		defaultValues.forceSync * 1000
	);

	// switch (currentUser.page) {
	// 	case "settings":
	// 		currentUser.intervals.pushToDbInterval = setInterval(
	// 			() => pushToDb(currentUser),
	// 			1000
	// 		);
	// 		break;
	// 	case "widget":
	// 		currentUser.intervals.syncFromDb = setInterval(
	// 			() => syncFromDb(currentUser),
	// 			defaultValues.widgetSyncFrequency * 1000
	// 		);
	// 		break;
	// }
}

export function closePage(currentUser: currentUserType) {
	clearInterval(currentUser.intervals.forceSync);

	switch (currentUser.page) {
		case "settings":
			clearInterval(currentUser.intervals.pushToDbInterval);
			break;
		case "widget":
			clearInterval(currentUser.intervals.syncFromDb);
			break;
	}
}
