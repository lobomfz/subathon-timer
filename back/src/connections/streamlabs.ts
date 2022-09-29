import { currentUserType, userConfigsType } from "../types";
import io from "socket.io-client";
import { addToEndTime } from "../timer/operations";
import { addDollar } from "./twitch";
import { userConfig, updateUserConfig } from "../cache/cache";

export function startStreamlabs(userId: number) {
	var userConfigs = userConfig.get(userId) as userConfigsType;
	if (userConfigs !== undefined && userConfigs.slToken !== undefined) {
		console.log(`connecting to ${userConfigs.name} streamlabs`);

		const slSocket = io(
			`https://sockets.streamlabs.com?token=${userConfigs.slToken}`,
			{
				transports: ["websocket"],
			}
		);

		slSocket.on("connect", () => {
			console.log(`connected to ${userConfigs.name} sl`);
			updateUserConfig(userId, "slStatus", true);
		});

		slSocket.on("disconnect", () => {
			updateUserConfig(userId, "slStatus", false);
		});

		slSocket.on("event", (e: any) => {
			if (e.type == "donation") addDollar(userId, e.message[0].amount);
		});
	}
}
