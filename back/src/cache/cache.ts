import { parseCurrentUser } from "../database/interactions";
import { userConfigsType } from "../types";
import NodeCache from "node-cache";
import { currentTime } from "../timeout/timeout";
import { createClient } from "redis";

const userClient = createClient({
	socket: {
		host: process.env.REDIS_HOST || "redis",
	},
});

export const localCache = new NodeCache();

userClient.connect();

userClient.on("error", (error) => {
	console.error(error);
});

export function getLocalCache(userId: number) {
	if (localCache.has(userId)) return localCache.get(userId) as any;
	else return {};
}

export function updateLocalCache(userId: number, data: any) {
	return localCache.set(userId, data);
}

export function tryToLoadUserFromCache(userId: number) {
	return new Promise(async function (resolve) {
		if (await userIsInCache(userId))
			resolve([true, await getUserConfigs(userId)]);
		else resolve([false, null]);
	});
}

export async function getUserConfigs(userId: number) {
	const user = (await userClient.get(userId.toString())) as string;
	return JSON.parse(user) as userConfigsType;
}

export async function getUserKey(userId: number, key: string) {
	const user: any = await getUserConfigs(userId);
	return key in user ? user[key] : false;
}

export async function userIsInCache(userId: number) {
	return await userClient.exists(userId.toString());
}

export async function createUserToCache(userInfo: any) {
	var newUser = {
		endTime: 0,
		subTime: 60,
		dollarTime: 15,
		slStatus: false,
		isAlive: true,
		lastPing: currentTime(),
		tmiAlive: false,
		slAlive: false,
	};

	Object.assign(userInfo, newUser);

	return await updateUserCache(userInfo);
}

export async function updateUserCache(userConfigs: userConfigsType) {
	if (!parseCurrentUser(userConfigs)) return false;

	return await userClient.set(
		userConfigs.userId.toString(),
		JSON.stringify(userConfigs)
	);
}

export async function setUserKey(userId: number, key: string, value: any) {
	var userConfigs: any = await getUserConfigs(userId);

	if (userConfigs) {
		userConfigs[key] = value;
		console.log(`setting ${userConfigs.name} ${key} to ${value}`);
		return await updateUserCache(userConfigs);
	}
}

export async function clearUserCache(userId: number) {
	const userConfigs = await getUserConfigs(userId);
	if (userConfigs) {
		userClient.del(userId.toString());
	}
}
