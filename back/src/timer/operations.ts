import { currentUserType } from "../types.js";

export function addToEndTime(
	currentUser: currentUserType,
	seconds: number | string
) {
	if (typeof seconds == "string") seconds = parseInt(seconds) || 0;
	if (!safeValue(seconds + currentUser.endTime)) return 0;

	const now = Math.trunc(Date.now() / 1000);
	if (currentUser.endTime < now) currentUser.endTime = now;
	currentUser.endTime += seconds;
	console.log(`adding ${seconds} to ${currentUser.name}`);
}

export function setEndTime(
	currentUser: currentUserType,
	endTime: number | string
) {
	if (typeof endTime == "string") endTime = parseInt(endTime) || 0;
	if (!safeValue(endTime)) return 0;

	currentUser.endTime = endTime;
	console.log(`settings endTime to ${endTime}`);
}

export function safeValue(value: number) {
	if (value > 2147483647 && value < -2147483648) {
		console.log(`User tried setting a value that was too large or small.`);
		return 0;
	}
	return 1;
}
