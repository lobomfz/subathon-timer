import url from "url";
import WebSocket from "ws";
import { wsType, currentUserType, initialUser } from "./types.js";
import { portWss, pages } from "./config/serverSettings.js";
import { defaultValues } from "./config/userSettings.js";
import { sendError, syncTimer, frontListener } from "./connections/frontend.js";
import { initializePage, closePage } from "./timer/setup.js";
import { tryToLoadUser, addUserToCache } from "./cache/cache.js";
import { getUserInfo } from "./connections/twitch.js";
import { tryToStartTmi, tryToStartStreamlabs } from "./cache/listeners.js";

const wss = new WebSocket.Server({ port: portWss });

function heartbeat(ws: wsType) {
	ws.isAlive = true;
}

function main() {
	wss.on("connection", (ws: wsType, req: any) => {
		ws.isAlive = true;
		ws.on("pong", () => heartbeat(ws));

		var urlParams = url.parse(req.url, true).query;

		ws.page =
			typeof urlParams["page"] == "string" && pages.includes(urlParams["page"])
				? urlParams["page"]
				: "other";

		var token = urlParams["token"]?.toString() || null;

		if (token)
			getUserInfo(token)
				.then((userInfo: any) => {
					tryToLoadUser(userInfo.userId)
						.then((loadedUser: any) => {
							// logged in and found cached user
							console.log(`loaded user: ${JSON.stringify(loadedUser)}`);
							tryToStartTmi(loadedUser.userId);
							tryToStartStreamlabs(userInfo.userId);
							frontListener(ws, loadedUser.userId);
							syncTimer(ws, userInfo.userId);
						})

						.catch((err: any) => {
							// not in cache, but logged in
							console.log(
								`not found in cache: ${err}, but logged in: ${JSON.stringify(
									userInfo
								)}`
							);

							addUserToCache(userInfo);
							tryToStartTmi(userInfo.userId);
							tryToStartStreamlabs(userInfo.userId);
							frontListener(ws, userInfo.userId);
							syncTimer(ws, userInfo.userId);
						});
				})

				.catch((err: any) => {
					// not logged in
					console.log(`failed to login: ${err}`);
				});
		else {
			ws.send("missing token");
			ws.close();
		}

		// login(ws, initialUser).then((res: any) => {
		// 	if (res == 0) {
		// 		sendError(ws as any, "invalid token.");
		// 		return 0;
		// 	}
		//
		// 	currentUser = res;
		//
		// 	initializePage(currentUser);
		// 	syncTimer(currentUser);
		//
		// 	ws.on("close", () => {
		// 		ws.isAlive = false;
		// 		currentUser.isAlive = false;
		// 		console.log(`Disconnected from ${ws.name}`);
		// 		closePage(currentUser);
		// 	});
		//
		// 	frontListener(ws, currentUser);
		// });
	});

	const timeout = setInterval(function ping() {
		wss.clients.forEach(function each(ws: any) {
			if (ws.isAlive === false) return ws.terminate();

			ws.isAlive = false;
			ws.ping();
		});
	}, defaultValues.timeoutTime * 1000);

	wss.on("close", function close() {
		clearInterval(timeout);
	});
}

main();
