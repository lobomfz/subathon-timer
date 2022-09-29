import { user, currentUserType } from "../types";
import { Users } from "./interface";
import { startTMI } from "../connections/twitch";
import { syncTimer } from "../connections/frontend";
import { safeValue } from "../timer/operations";

function parseCurrentUser(currentUser: currentUserType) {
	if (
		!safeValue(currentUser.endTime) ||
		!safeValue(currentUser.subTime) ||
		!safeValue(currentUser.dollarTime) ||
		!safeValue(currentUser.userId)
	) {
		return 0;
	}
	if (currentUser.name.length > 32 || currentUser.accessToken.length > 100)
		return 0;
	if (
		typeof currentUser.slToken == "string" &&
		currentUser.slToken.length > 300
	)
		return 0;
	return 1;
}

export async function pushToDb(currentUser: currentUserType) {
	if (currentUser.page == "settings" && parseCurrentUser(currentUser)) {
		Users.update(
			{
				name: currentUser.name,
				accessToken: currentUser.accessToken,
				subTime: currentUser.subTime,
				dollarTime: currentUser.dollarTime,
				slToken: currentUser.slToken,
				endTime: currentUser.endTime,
			},
			{
				where: {
					userId: currentUser.userId,
				},
			}
		);
	}
}

export function updateSetting(currentUser: currentUserType, data: any) {
	var value: number = parseInt(data.value) || 0;

	switch (data.setting) {
		case "subTime":
			console.log(`setting ${currentUser.name} sub time to`, value);
			currentUser.subTime = value;
			break;
		case "dollarTime":
			console.log(`setting ${currentUser.name} dollar time to`, value);
			currentUser.dollarTime = value;
			break;
	}
}

export async function createUser(user: user) {
	console.log;
	Users.create({
		userId: user.userId,
		name: user.name,
		accessToken: user.accessToken,
		subTime: user.subTime,
		dollarTime: user.dollarTime,
		slToken: user.slToken,
		endTime: user.endTime,
	});
}

export async function loadUser(currentUser: currentUserType, id: number) {
	Users.findByPk(currentUser.userId).then((res: any) => {
		if (!res) {
			createUser(currentUser);
			//startTMI(currentUser);
		} else {
			Object.assign(currentUser, res.dataValues);
			// if (currentUser.slToken) connectStreamlabs(currentUser);
			// else syncTimer(currentUser);
			//startTMI(currentUser);
		}
	});
}
