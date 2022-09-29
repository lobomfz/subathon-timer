import { userConfig, updateUserCache } from "./cache";
import { startTMI } from "../connections/twitch";
import { userConfigsType } from "../types";
import { startStreamlabs } from "../connections/streamlabs";

export async function tryToStartTmi(userId: number) {
	if (!userConfig.has(userId)) return 0;

	var userConfigs = userConfig.get(userId) as userConfigsType;

	if (userConfigs !== undefined) {
		if ("tmi" in userConfigs) {
			console.log(`tmi already started on ${userConfigs.name}`);
			return 0;
		} else {
			console.log("trying to start listener");
			userConfigs.tmi = startTMI;
			userConfigs.tmi(userConfigs.name, userConfigs.userId);
			updateUserCache(userConfigs);

			return 1;
		}
	}
}

export async function tryToStartStreamlabs(userId: number) {
	if (!userConfig.has(userId)) return 0;

	var userConfigs = userConfig.get(userId) as userConfigsType;

	if (userConfigs !== undefined && userConfigs.slToken !== undefined) {
		if ("slSocket" in userConfigs) {
			console.log(`slsocket already started on ${userConfigs.name}`);
			return 0;
		} else {
			console.log("trying to start listener");
			userConfigs.slSocket = startStreamlabs;
			userConfigs.slSocket(
				userConfigs.userId,
				userConfigs.slToken,
				userConfigs.name
			);

			updateUserCache(userConfigs);

			return 1;
		}
	}
}
