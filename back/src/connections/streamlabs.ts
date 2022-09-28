import { currentUserType } from "../types";
import io from "socket.io-client";
import { addToEndTime } from "../timer/operations";

export function connectStreamlabs(currentUser: currentUserType) {
	if (currentUser.slSocket) currentUser.slSocket.disconnect();
	if (!currentUser.slToken) return 0;

	console.log(`connecting to ${currentUser.name} sl`);

	var aliveCheck = setInterval(() => {
		if (!currentUser.isAlive) {
			currentUser.slSocket.disconnect();
			clearInterval(aliveCheck);
			return 0;
		}
	}, 1000);

	currentUser.slSocket = io(
		`https://sockets.streamlabs.com?token=${currentUser.slToken}`,
		{
			transports: ["websocket"],
		}
	);

	currentUser.slSocket.on("connect", () => {
		console.log(`connected to ${currentUser.name} sl`);
		currentUser.slStatus = true;
	});

	currentUser.slSocket.on("disconnect", () => {
		currentUser.slStatus = false;
	});

	currentUser.slSocket.on("event", (e: any) => {
		if (e.type == "donation")
			addToEndTime(currentUser, e.message[0].amount * currentUser.dollarTime);
	});
}
