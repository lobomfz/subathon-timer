import {
	createUserToDb,
	loadUserFromDb,
	parseCurrentUser,
} from "../database/interactions";
import NodeCache from "node-cache";
import { userConfigsType } from "../types";
import { currentTime } from "../timeout/timeout";
import { defaultUser, exampleUser } from "../config/userSettings";
import { syncTimer } from "../connections/frontend";

export const userConfig = new NodeCache();

export function loadUser(userId: number, name: string) {
	return new Promise(function (resolve) {
		if (isUserInCache(userId)) resolve(true);

		loadUserFromDb(userId).then((success: any) => {
			if (!success) resolve(createNewUser(userId, name));
			else resolve(true);
		});
	});
}

export function updateSettings(userId: number, settings: any) {
	let userConfigs = getUserConfigs(userId) as any;

	for (const [key, value] of Object.entries(settings)) {
		if (exampleUser.includes(key)) userConfigs[key] = value;
	}

	return updateUserCache(userConfigs);
}

function isUserInCache(userId: number) {
	return userConfig.has(userId);
}

export function tryToLoadUserFromCache(userId: number) {
	return new Promise(function (resolve) {
		if (userConfig.has(userId))
			resolve([true, userConfig.get(userId) as userConfigsType]);
		else resolve([false, null]);
	});
}

export function getUserConfigs(userId: number) {
	return userConfig.get(userId) as userConfigsType;
}

export async function createNewUser(userId: number, name: string) {
	var newUser = {
		isAlive: true,
		lastPing: currentTime(),
		userId: userId,
		name: name,
	};

	Object.assign(newUser, defaultUser);

	createUserToDb(userId, name);

	return userConfig.set(userId, newUser);
}

export function updateUserCache(userConfigs: any) {
	if (!parseCurrentUser(userConfigs)) return false;

	if (userConfig.set(userConfigs.userId, userConfigs)) {
		return syncTimer(userConfigs.userId);
	}
}

export async function forceUpdateUserConfig(
	userId: number,
	key: string,
	value: any
) {
	if (!userConfig.has(userId)) return false;
	var userConfigs: any = getUserConfigs(userId); // TODO: remove this any

	userConfigs[key] = value;
	return userConfig.set(userConfigs.userId, userConfigs);
}

export function clearUserCache(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	clearInterval(userConfigs.intervals.timeoutChecker);
	clearInterval(userConfigs.intervals.pushToDb);
	userConfig.del(userId);
}
