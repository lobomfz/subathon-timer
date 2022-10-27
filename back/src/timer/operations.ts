import { userConfigs } from "../index";
import { updateSettings } from "../cache/cache";

export function addToEndTime(userId: number, seconds: number | string) {
	if (typeof seconds == "string") seconds = parseInt(seconds) || 0;

	const finalTime = seconds + userConfigs[userId].endTime;
	if (!safeValue(finalTime)) return false;

	const now = Math.trunc(Date.now() / 1000);

	if (userConfigs[userId].endTime < now)
		userConfigs[userId].endTime = now + seconds;
	else userConfigs[userId].endTime = finalTime;

	console.log(`adding ${seconds} to ${userConfigs[userId].name}`);
	return updateSettings(userConfigs[userId].userId, {
		endTime: userConfigs[userId].endTime,
	});
}

export function setEndTime(userId: number, endTime: number) {
	updateSettings(userId, { endTime: endTime });
}

export function safeValue(value: number) {
	if (value < 2147483647 && value > -2147483648) return true;
	console.log(
		`User tried setting a value that was too large or small: ${value}`
	);
	return false;
}
