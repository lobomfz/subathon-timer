import io from "socket.io-client";
import { addDollar } from "./twitch";
import { userConfig, updateUserConfig, getUserConfigs } from "../cache/cache";
import { defaultValues } from "../config/userSettings";

export function startStreamlabs(userId: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	if (userConfigs.slToken) {
		const slSocket = io(
			`https://sockets.streamlabs.com?token=${userConfigs.slToken}`,
			{
				transports: ["websocket"],
			}
		);

		const isAlive = setInterval(() => {
			if (!userConfig.has(userId)) {
				slSocket.disconnect();
				clearInterval(isAlive);
			}
		}, defaultValues.checkForTimeout * 1000);

		slSocket.on("connect", () => {
			console.log(`connected to ${userConfigs.name} sl`);
			updateUserConfig(userId, "slStatus", true);
		});

		slSocket.on("disconnect", () => {
			console.log(`disconnected from ${userConfigs.name} sl`);
			updateUserConfig(userId, "slStatus", false);
		});

		slSocket.on("event", (e: any) => {
			if (e.type == "donation") addDollar(userId, e.message[0].amount);
		});
	}
}
