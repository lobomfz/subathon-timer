import { currentUserType, wsType } from "../types";
import { Users } from "../database/interface";
import { updateSetting } from "../database/interactions";
import { setEndTime } from "../timer/operations";
import { connectStreamlabs } from "../connections/streamlabs";

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

export async function syncTimer(currentUser: currentUserType) {
	console.log(
		`trying to send to ${currentUser.name} on ${currentUser.page} endtime: ${currentUser.endTime}`
	);
	currentUser.send(
		JSON.stringify({
			success: true,
			endTime: currentUser.endTime,
			subTime: currentUser.subTime,
			dollarTime: currentUser.dollarTime,
			slStatus: currentUser.slStatus,
		})
	);
}

export function frontListener(ws: wsType, currentUser: currentUserType) {
	ws.onmessage = function (event: any) {
		try {
			var data = JSON.parse(event.data);
		} catch (error) {
			sendError(currentUser.send, "json error");
			return 0;
		}
		console.log(
			`received from ${currentUser.name} on ${currentUser.page}:`,
			JSON.stringify(event.data)
		);

		switch (data.event) {
			case "getTime":
				syncTimer(currentUser);
				break;
			case "connectStreamlabs":
				if (data.slToken.length < 300) currentUser.slToken = data.slToken;
				connectStreamlabs(currentUser);
				break;
			case "setSetting":
				updateSetting(currentUser, data);
				break;
			case "setEndTime":
				if (data.value) setEndTime(currentUser, data.value);
				break;
		}
		syncTimer(currentUser);
	};
}
