import { userConfigsType } from "../types";
import { Users } from "./interface";
import { safeValue } from "../timer/operations";
import { getUserConfigs, updateUserCache, userConfig } from "../cache/cache";
import { currentTime } from "../timeout/timeout";

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
	let userConfigs = getUserConfigs(userId);

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

export async function createUserToDb(userId: number, name: string) {
	console.trace(`creating user ${name} to db`);
	Users.findByPk(userId).then((res: any) => {
		if (!res)
			Users.create({
				userId: userId,
				name: name,
				subTime: 60,
				dollarTime: 15,
				slToken: null,
				endTime: 0,
			});
	});
}

export async function loadUserFromDb(userId: number) {
	return new Promise(async function (resolve) {
		Users.findByPk(userId).then((res: any) => {
			if (res) {
				let loadedUser = {
					lastPing: currentTime(),
					isAlive: true,
					intervals: {},
				};

				Object.assign(loadedUser, res.dataValues as userConfigsType);
				resolve(updateUserCache(loadedUser));
			} else resolve(false);
		});
	});
}
