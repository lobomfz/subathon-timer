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
		case "slToken":
			console.log(`setting ${userConfigs.name} slToken to`, value);
			userConfigs.slToken = value;
			break;
	}

	return updateUserCache(userConfigs);
}

export async function createUserToDb(userInfo: any) {
	return Users.create({
		userId: userInfo.userId,
		name: userInfo.name,
		subTime: 60,
		dollarTime: 15,
		slToken: null,
		endTime: 0,
	});
}

export async function loadUserFromDb(userId: number) {
	return new Promise(function (resolve, reject) {
		Users.findByPk(userId).then((res: any) => {
			if (!res) resolve([false, "User not found in db"]);
			else {
				var user = res.dataValues as userConfigsType;
				user.intervals = {};

				if (userConfig.set(user.userId, user)) resolve([true, user]);
				else reject("error pushing user to cache");
			}
		});
	});
}
