import NodeCache from "node-cache";
import { userConfigsType } from "../types";

export const userConfig = new NodeCache();

export async function tryToLoadUser(userId: number) {
	// TODO: add postgres

	return new Promise(function (resolve, reject) {
		const user = userConfig.get(userId) as userConfigsType;

		if (user) resolve(user);
		reject("user not found");
	});
}

export async function addUserToCache(userInfo: any) {
	// TODO: add postgres

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

export async function updateUserCache(userInfo: any) {
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
	var userConfigs = userConfig.get(userId) as any;

	userConfigs[key] = value;

	console.log(
		`updating cache for ${userConfigs.name} with key ${key} and value ${value}`
	);
	return userConfig.set(userConfigs.userId, userConfigs);
}

// var success = userConfig.set("2345", () => {
// 	while (1) {
// 		console.log("test");
// 	}
// });
//
// console.log(userConfig.get("2345"));
