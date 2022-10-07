import { userConfig, updateUserConfig, getUserConfigs } from "../cache/cache";

export function addToEndTime(userId: number, seconds: number | string) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	if (typeof seconds == "string") seconds = parseInt(seconds) || 0;

	const finalTime = seconds + userConfigs.endTime;
	if (!safeValue(finalTime)) return false;

	const now = Math.trunc(Date.now() / 1000);

	if (userConfigs.endTime < now) userConfigs.endTime = now + seconds;
	else userConfigs.endTime = finalTime;

	console.log(`adding ${seconds} to ${userConfigs.name}`);
	return updateUserConfig(userConfigs.userId, "endTime", userConfigs.endTime);
}

export function setEndTime(userId: number, endTime: number) {
	updateUserConfig(userId, "endTime", endTime);
}

export function safeValue(value: number) {
	if (value < 2147483647 && value > -2147483648) return true;
	console.log(
		`User tried setting a value that was too large or small: ${value}`
	);
	return false;
}
