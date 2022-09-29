import { currentUserType } from "../types.js";
import { userConfig, updateUserConfig } from "../cache/cache.js";

export function addToEndTime(userId: number, seconds: number | string) {
	var currentUser = userConfig.get(userId) as currentUserType;

	if (typeof seconds == "string") seconds = parseInt(seconds) || 0;
	if (!safeValue(seconds + currentUser.endTime)) return 0;

	const now = Math.trunc(Date.now() / 1000);
	if (currentUser.endTime < now) currentUser.endTime = now + seconds;
	else currentUser.endTime += seconds;
	console.log(`adding ${seconds} to ${currentUser.name}`);
	updateUserConfig(currentUser.userId, "endTime", currentUser.endTime);
}

export function setEndTime(userId: number, endTime: number) {
	updateUserConfig(userId, "endTime", endTime);
}

export function safeValue(value: number) {
	if (value > 2147483647 && value < -2147483648) {
		console.log(`User tried setting a value that was too large or small.`);
		return 0;
	}
	return 1;
}
