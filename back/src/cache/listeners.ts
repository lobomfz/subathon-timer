import { startTMI } from "../connections/twitch";
import { startStreamlabs } from "../connections/streamlabs";
import { pushToDb } from "../database/interactions";
import { checkForTimeout } from "../timeout/timeout";
import { defaultValues } from "../config/userSettings";
import { userConfigs } from "../index";

export async function tryToStartTmi(userId: number) {
	if (userConfigs[userId].tmiAlive || userConfigs[userId].connectingToTmi) {
		return false;
	} else {
		startTMI(userConfigs[userId].name, userId);
		userConfigs[userId].connectingToTmi = true;
		return true;
	}
}

export async function tryToStartStreamlabs(userId: number) {
	if ("slToken" in userConfigs[userId] && userConfigs[userId].slToken) {
		if (userConfigs[userId].slStatus || userConfigs[userId].connectingToSl) {
			return false;
		} else {
			startStreamlabs(userConfigs[userId].userId);
			userConfigs[userId].connectingToSl = true;
			return true;
		}
	}
}

export async function tryToPushToDb(userId: number) {
	if (userConfigs[userId].isAlive) {
		if ("pushToDb" in userConfigs[userId].intervals) {
			return false;
		} else {
			userConfigs[userId].intervals.pushToDb = setInterval(() => {
				pushToDb(userConfigs[userId].userId);
			}, defaultValues.pushFrequency * 1000);
			return true;
		}
	}
}

export async function timeoutChecker(userId: number) {
	if (userConfigs[userId]) {
		if ("timeoutChecker" in userConfigs[userId].intervals) return false;

		userConfigs[userId].intervals.timeoutChecker = setInterval(() => {
			checkForTimeout(userConfigs[userId].userId);
		}, defaultValues.checkForTimeout * 1000);

		return true;
	}
}
