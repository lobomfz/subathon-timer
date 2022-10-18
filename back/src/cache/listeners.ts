import {
	updateUserCache,
	getUserConfigs,
	userIsInCache,
	setUserKey,
	localCache,
	getLocalCache,
	updateLocalCache,
} from "./cache";
import { startTMI } from "../connections/twitch";
import { startStreamlabs } from "../connections/streamlabs";
import { pushToDb } from "../database/interactions";
import { checkForTimeout } from "../timeout/timeout";
import { defaultValues } from "../config/userSettings";

export async function tryToStartTmi(userId: number) {
	if (!(await userIsInCache(userId))) return false;
	var userConfigs = await getUserConfigs(userId);

	if (!userConfigs.tmiAlive) {
		console.log("trying to start tmi");
		startTMI(userConfigs.name, userConfigs.userId);
		setUserKey(userId, "tmiAlive", true);
		return true;
	}

	console.log("tmi already started");
	return false;
}

export async function tryToStartStreamlabs(userId: number) {
	if (!(await userIsInCache(userId))) return false;
	var userConfigs = await getUserConfigs(userId);

	var localCache = getLocalCache(userId);

	if (userConfigs.slToken && !userConfigs.slStatus) {
		startStreamlabs(userConfigs.userId);
		setUserKey(userId, "slStatus", true);
		return true;
	}
}

export async function tryToPushToDb(userId: number) {
	if (!(await userIsInCache(userId))) return false;
	var userConfigs = await getUserConfigs(userId);

	var localCache = getLocalCache(userId);

	if (userConfigs.isAlive) {
		if ("pushToDb" in localCache) {
			return false;
		} else {
			localCache.pushToDb = setInterval(() => {
				pushToDb(userConfigs.userId);
			}, defaultValues.pushFrequency * 1000);
			updateLocalCache(userId, localCache);
			return true;
		}
	}
}

export async function timeoutChecker(userId: number) {
	if (!(await userIsInCache(userId))) return false;
	var userConfigs = await getUserConfigs(userId);

	var localCache = getLocalCache(userId);

	if (userConfigs) {
		if ("timeoutChecker" in userConfigs) {
			return false;
		} else {
			localCache.timeoutChecker = setInterval(() => {
				checkForTimeout(userConfigs.userId);
			}, defaultValues.checkForTimeout * 1000);

			updateLocalCache(userId, localCache);
			return true;
		}
	}
}
