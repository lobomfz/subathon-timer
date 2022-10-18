import { defaultValues } from "../config/userSettings";
import {
	clearUserCache,
	getUserConfigs,
	setUserKey,
	userIsInCache,
} from "../cache/cache";

export function currentTime() {
	return Math.floor(Date.now() / 1000);
}

export function updateLastPing(userId: number) {
	setUserKey(userId, "isAlive", true);
	setUserKey(userId, "lastPing", currentTime());
}

export async function checkForTimeout(userId: number) {
	if (!(await userIsInCache(userId))) return false;
	var userConfigs = await getUserConfigs(userId);

	if (currentTime() - userConfigs.lastPing > defaultValues.sessionTimeout) {
		console.log(`user ${userConfigs.name} timed out`);
		setUserKey(userId, "isAlive", false);
		clearUserCache(userId);
	}
}
