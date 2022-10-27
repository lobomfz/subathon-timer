import io from "socket.io-client";
import { addDollar } from "./twitch";
import { updateSettings } from "../cache/cache";
import { defaultValues } from "../config/userSettings";
import { userConfigs } from "../index";

export function startStreamlabs(userId: number) {
	if ("slToken" in userConfigs[userId]) {
		const slSocket = io(
			`https://sockets.streamlabs.com?token=${userConfigs[userId].slToken}`,
			{
				transports: ["websocket"],
			}
		);

		const isAlive = setInterval(() => {
			if (!(userId in userConfigs)) {
				slSocket.disconnect();
				clearInterval(isAlive);
			}
		}, defaultValues.checkForTimeout * 1000);

		slSocket.on("connect", () => {
			console.log(`connected to ${userConfigs[userId].name} sl`);
			updateSettings(userId, { slStatus: true });
		});

		slSocket.on("disconnect", () => {
			console.log(`disconnected from ${userConfigs[userId].name} sl`);
			updateSettings(userId, { slStatus: false, connectingToSl: false });
		});

		slSocket.on("event", (e: any) => {
			if (e.type == "donation") addDollar(userId, e.message[0].amount);
		});
	}
}
