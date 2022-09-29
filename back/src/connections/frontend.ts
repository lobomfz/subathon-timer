import { currentUserType, wsType, userConfigsType } from "../types";
import { Users } from "../database/interface";
import { updateSetting } from "../database/interactions";
import { setEndTime, addToEndTime } from "../timer/operations";
import { userConfig } from "../cache/cache";

export async function sendError(currentUser: currentUserType, message: string) {
	currentUser.send(
		JSON.stringify({
			error: message,
		})
	);
}

export function syncFromDb(currentUser: currentUserType) {
	switch (currentUser.page) {
		case "widget":
			Users.findByPk(currentUser.userId).then((res: any) => {
				if (res && currentUser.endTime !== res.dataValues.endTime) {
					currentUser.endTime = res.dataValues.endTime;
				}
			});
			break;
	}
}

export async function syncTimer(ws: wsType, userId: number) {
	if (!userConfig.has(userId)) return 0;

	var userConfigs = userConfig.get(userId) as userConfigsType;

	console.log(
		`trying to send to ${userConfigs.name} on ${ws.page} endtime: ${userConfigs.endTime}`
	);

	ws.send(
		JSON.stringify({
			success: true,
			endTime: userConfigs.endTime,
			subTime: userConfigs.subTime,
			dollarTime: userConfigs.dollarTime,
			slStatus: userConfigs.slStatus,
		})
	);
}

export function frontListener(ws: wsType, userId: number) {
	ws.onmessage = function (event: any) {
		var userConfigs = userConfig.get(userId) as userConfigsType;

		try {
			var data = JSON.parse(event.data);
		} catch (error) {
			// sendError(ws.send, "json error");
			return 0;
		}
		console.log(
			`received from ${userConfigs.name} on ${ws.page}:`,
			JSON.stringify(event.data)
		);

		switch (data.event) {
			case "getTime":
				// syncTimer(currentUser);
				break;
			case "connectStreamlabs":
				if (data.slToken.length < 300) userConfigs.slToken = data.slToken;
				//connectStreamlabs(currentUser);
				break;
			case "setSetting":
				// updateSetting(userConfigs, data);
				break;
			case "setEndTime":
				if (data.value) setEndTime(userConfigs.userId, data.value);
				break;
			case "addTime":
				if (data.value) addToEndTime(userConfigs.userId, data.value);
				break;
		}
		syncTimer(ws, userId);
	};
}
