import { defaultValues } from "../config/userSettings";
import { clearUserCache, updateSettings } from "../cache/cache";
import { userConfigs } from "../index";

export function currentTime() {
	return Math.floor(Date.now() / 1000);
}

export function updateLastPing(userId: number) {
	updateSettings(userId, { lastPing: currentTime(), isAlive: true });
}

export function checkForTimeout(userId: number) {
	if (
		currentTime() - userConfigs[userId].lastPing >
		defaultValues.sessionTimeout
	) {
		console.log(`user ${userConfigs[userId].name} timed out`);
		updateSettings(userId, { isAlive: false });
		clearUserCache(userId);
	}
}
