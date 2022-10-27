import {
	createUserToDb,
	loadUserFromDb,
	parseCurrentUser,
} from "../database/interactions";
import { currentTime } from "../timeout/timeout";
import { defaultUser, exampleUser } from "../config/userSettings";
import { userConfigs } from "../index";
import { syncTimer } from "../connections/frontend";

export function loadUser(userId: number, name: string) {
	return new Promise(function (resolve) {
		if (!(userId in userConfigs)) {
			userConfigs[userId] = {
				lastPing: currentTime(),
				isAlive: true,
				intervals: {},
				userId: userId,
				name: name,
			};
		}

		if ("subTime" in userConfigs[userId]) resolve(true);

		loadUserFromDb(userId).then((success: any) => {
			if (!success) resolve(createNewUser(userId, name));
			else resolve(true);
		});
	});
}

export function updateSettings(userId: number, settings: any) {
	if (!userId || !(userId in userConfigs)) {
		console.trace();
		return false;
	}
	for (const [key, value] of Object.entries(settings)) {
		if (exampleUser.includes(key)) {
			userConfigs[userId][key] = value;
		}
	}
	syncTimer(userId);
}

export async function createNewUser(userId: number, name: string) {
	createUserToDb(userId, name);

	return Object.assign(userConfigs[userId], defaultUser);
}

export function clearUserCache(userId: number) {}
