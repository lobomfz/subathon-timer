import { userConfigsType } from "../types";
import { Users } from "./interface";
import { safeValue } from "../timer/operations";
import { currentTime } from "../timeout/timeout";
import { userConfigs } from "../index";

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
	if (parseCurrentUser(userConfigs[userId]))
		return Users.update(
			{
				name: userConfigs[userId].name,
				subTime: Math.floor(userConfigs[userId].subTime),
				dollarTime: Math.floor(userConfigs[userId].dollarTime),
				slToken: userConfigs[userId].slToken,
				endTime: Math.floor(userConfigs[userId].endTime),
			},
			{
				where: {
					userId: userConfigs[userId].userId,
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
				resolve(
					Object.assign(userConfigs[userId], res.dataValues as userConfigsType)
				);
			} else resolve(false);
		});
	});
}
