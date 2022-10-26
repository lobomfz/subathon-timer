import { defaultValues } from "../config/userSettings";
import {
	clearUserCache,
	getUserConfigs,
	updateSettings,
	userConfig,
} from "../cache/cache";

export function currentTime() {
	return Math.floor(Date.now() / 1000);
}

export function updateLastPing(userId: number) {
	updateSettings(userId, { lastPing: currentTime(), isAlive: true });
}

export function checkForTimeout(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	if (currentTime() - userConfigs.lastPing > defaultValues.sessionTimeout) {
		console.log(`user ${userConfigs.name} timed out`);
		updateSettings(userId, { isAlive: false });
		clearUserCache(userId);
	}
}
