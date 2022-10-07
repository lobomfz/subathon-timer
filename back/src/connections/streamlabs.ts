import io from "socket.io-client";
import { addDollar } from "./twitch";
import { userConfig, updateUserConfig, getUserConfigs } from "../cache/cache";

export function startStreamlabs(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	if (userConfigs.slToken) {
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
