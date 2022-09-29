import { currentUserType } from "../types.js";
import { defaultValues } from "../config/userSettings.js";
import { syncTimer, syncFromDb } from "../connections/frontend.js";
import { pushToDb } from "../database/interactions.js";

export function initializePage(currentUser: currentUserType) {
	// currentUser.intervals.forceSync = setInterval(
	// 	() => syncTimer(currentUser),
	// 	defaultValues.forceSync * 1000
	// );

	switch (currentUser.page) {
		case "settings":
			currentUser.intervals.pushToDbInterval = setInterval(
				() => pushToDb(currentUser),
				1000
			);
			break;
		case "widget":
			currentUser.intervals.syncFromDb = setInterval(
				() => syncFromDb(currentUser),
				defaultValues.widgetSyncFrequency * 1000
			);
			break;
	}
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
