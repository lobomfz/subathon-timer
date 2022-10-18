import io from "socket.io-client";
import { addDollar } from "./twitch";
import { setUserKey, getUserConfigs, userIsInCache } from "../cache/cache";
import { defaultValues } from "../config/userSettings";

export async function startStreamlabs(userId: number) {
	if (!(await userIsInCache(userId))) return false;
	var userConfigs = await getUserConfigs(userId);

	if (userConfigs.slToken) {
		const slSocket = io(
			`https://sockets.streamlabs.com?token=${userConfigs.slToken}`,
			{
				transports: ["websocket"],
			}
		);

		const isAlive = setInterval(() => {
			if (!userIsInCache(userId)) {
				slSocket.disconnect();
				clearInterval(isAlive);
			}
		}, defaultValues.checkForTimeout * 1000);

		slSocket.on("connect", () => {
			console.log(`connected to ${userConfigs.name} sl`);
			setUserKey(userId, "slStatus", true);
		});

		slSocket.on("disconnect", () => {
			console.log(`disconnected from ${userConfigs.name} sl`);
			setUserKey(userId, "slStatus", false);
		});

		slSocket.on("event", (e: any) => {
			if (e.type == "donation") addDollar(userId, e.message[0].amount);
		});
	}
}
