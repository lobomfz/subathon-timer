import { userConfig, updateUserCache, getUserConfigs } from "./cache";
import { startTMI } from "../connections/twitch";
import { startStreamlabs } from "../connections/streamlabs";

export async function tryToStartTmi(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	if (userConfigs !== undefined) {
		if ("tmi" in userConfigs) {
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
}

export async function tryToStartStreamlabs(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);
	// TODO: add a way to disconnect streamlabs
	if (userConfigs.slToken && !userConfigs.slStatus) {
		if ("slSocket" in userConfigs) {
			console.log(`slsocket already started on ${userConfigs.name}`);
			return false;
		} else {
			console.log("trying to start streamlabs");
			userConfigs.slSocket = startStreamlabs;
			userConfigs.slSocket(userConfigs.userId);
			updateUserCache(userConfigs);
			return true;
		}
	}
}
