import { user, userConfigsType } from "../types";
import { Users } from "./interface";
import { safeValue } from "../timer/operations";
import { getUserConfigs, updateUserCache, userConfig } from "../cache/cache";

export function parseCurrentUser(userConfigs: userConfigsType) {
	if (
		!safeValue(userConfigs.endTime) ||
		!safeValue(userConfigs.subTime) ||
		!safeValue(userConfigs.dollarTime) ||
		!safeValue(userConfigs.userId)
	) {
		return false;
	}
	if (userConfigs.name.length > 32) return false;
	if (
		typeof userConfigs.slToken == "string" &&
		userConfigs.slToken.length > 300
	)
		return false;
	return true;
}

export async function pushToDb(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	if (parseCurrentUser(userConfigs))
		return Users.update(
			{
				name: userConfigs.name,
				subTime: Math.floor(userConfigs.subTime),
				dollarTime: Math.floor(userConfigs.dollarTime),
				slToken: userConfigs.slToken,
				endTime: Math.floor(userConfigs.endTime),
			},
			{
				where: {
					userId: userConfigs.userId,
				},
			}
		);
}

export function updateSetting(userId: number, setting: string, value: any) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	switch (setting) {
		case "subTime":
			console.log(`setting ${userConfigs.name} sub time to`, value);
			userConfigs.subTime = value;
			break;
		case "dollarTime":
			console.log(`setting ${userConfigs.name} dollar time to`, value);
			userConfigs.dollarTime = value;
			break;
	}

	return updateUserCache(userConfigs);
}

export async function createUser(user: user) {
	return Users.create({
		userId: user.userId,
		name: user.name,
		subTime: user.subTime,
		dollarTime: user.dollarTime,
		slToken: user.slToken,
		endTime: user.endTime,
	});
}

export async function loadUserFromDb(userId: number) {
	return new Promise(function (resolve, reject) {
		Users.findByPk(userId).then((res: any) => {
			if (!res) reject("user not found in cache");
			var user = res.dataValues as userConfigsType;

			user.intervals = {};

			const success = userConfig.set(user.userId, user);
			if (success) resolve(user);
			else reject("error loading user");
		});
	});
}
