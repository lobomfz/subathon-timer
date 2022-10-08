import { defaultValues } from "../config/userSettings";
import {
	clearUserCache,
	getUserConfigs,
	updateUserConfig,
	userConfig,
} from "../cache/cache";

export function currentTime() {
	return Math.floor(Date.now() / 1000);
}

export function updateLastPing(userId: number) {
	updateUserConfig(userId, "isAlive", true);
	updateUserConfig(userId, "lastPing", currentTime());
}

export function checkForTimeout(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	if (currentTime() - userConfigs.lastPing > defaultValues.sessionTimeout) {
		console.log(`user ${userConfigs.name} timed out`);
		updateUserConfig(userId, "isAlive", false);
		clearUserCache(userId);
	}
}
