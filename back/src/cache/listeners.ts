import { userConfig, updateUserCache, getUserConfigs } from "./cache";
import { startTMI } from "../connections/twitch";
import { startStreamlabs } from "../connections/streamlabs";
import { pushToDb } from "../database/interactions";
import { checkForTimeout } from "../keepalive/timing";
import { defaultValues } from "../config/userSettings";

export async function tryToStartTmi(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	if (userConfigs.tmiAlive) {
		console.log(`tmi already started on ${userConfigs.name}`);
		return false;
	} else {
		console.log("trying to start tmi");
		userConfigs.tmi = startTMI;
		userConfigs.tmi(userConfigs.name, userConfigs.userId);
		updateUserCache(userConfigs);

		return true;
	}
}

export async function tryToStartStreamlabs(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);
	if (userConfigs.slToken && !userConfigs.slStatus) {
		if (userConfigs.slStatus) {
			return false;
		} else {
			userConfigs.slSocket = startStreamlabs;
			userConfigs.slSocket(userConfigs.userId);
			updateUserCache(userConfigs);
			return true;
		}
	}
}

export async function tryToPushToDb(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	if (userConfigs.isAlive) {
		if ("pushToDb" in userConfigs) {
			return false;
		} else {
			userConfigs.intervals.pushToDb = setInterval(() => {
				pushToDb(userConfigs.userId);
			}, defaultValues.pushFrequency * 1000);
			updateUserCache(userConfigs);
			return true;
		}
	}
}

export async function timeoutChecker(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	if (userConfigs) {
		if ("timeoutChecker" in userConfigs) {
			return false;
		} else {
			userConfigs.intervals.timeoutChecker = setInterval(() => {
				checkForTimeout(userConfigs.userId);
			}, defaultValues.checkForTimeout * 1000);

			updateUserCache(userConfigs);
			return true;
		}
	}
}
