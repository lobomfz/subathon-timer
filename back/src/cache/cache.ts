import { parseCurrentUser } from "../database/interactions";
import NodeCache from "node-cache";
import { userConfigsType } from "types";

export const userConfig = new NodeCache();

export function tryToLoadUserFromCache(userId: number) {
	return new Promise(function (resolve, reject) {
		if (userConfig.has(userId)) resolve(userConfig.get(userId));
		reject("user not found");
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
	};

	Object.assign(userInfo, newUser);

	return userConfig.set(userInfo.userId, userInfo);
}

export function updateUserCache(userInfo: any) {
	if (!parseCurrentUser(userInfo)) return false;
	console.log(
		`updating cache for ${userInfo.name} with ${JSON.stringify(userInfo)}`
	);
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

	console.log(
		`updating cache for ${userConfigs.name} with key ${key} and value ${value}`
	);

	return userConfig.set(userConfigs.userId, userConfigs);
}
