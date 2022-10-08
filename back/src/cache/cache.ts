import { parseCurrentUser } from "../database/interactions";
import NodeCache from "node-cache";
import { userConfigsType } from "../types";
import { currentTime } from "../keepalive/timing";

export const userConfig = new NodeCache();

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

export async function createUserToCache(userInfo: any) {
	var newUser = {
		endTime: 0,
		subTime: 60,
		dollarTime: 15,
		slStatus: false,
		intervals: {},
		isAlive: true,
		lastPing: currentTime(),
		tmiAlive: false,
		slAlive: false,
	};

	Object.assign(userInfo, newUser);

	return userConfig.set(userInfo.userId, userInfo);
}

export function updateUserCache(userInfo: any) {
	if (!parseCurrentUser(userInfo)) return false;

	return userConfig.set(userInfo.userId, userInfo);
}

export async function updateUserConfig(
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
