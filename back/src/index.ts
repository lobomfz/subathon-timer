import url from "url";
import WebSocket from "ws";
import { wsType } from "./types";
import { portWss, pages } from "./config/serverSettings";
import { defaultValues } from "./config/userSettings";
import { initializePage } from "./timer/setup";
import { tryToLoadUser, addUserToCache } from "./cache/cache";
import { getUserInfo } from "./connections/twitch";
// TODO: tsc debugging setup

const wss = new WebSocket.Server({ port: portWss });

function heartbeat(ws: wsType) {
	ws.isAlive = true;
}

console.log("debug!");

console.log("debug2!");

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
							console.log("found cached user");
							initializePage(ws, loadedUser);
						})

						.catch((err: any) => {
							// not in cache, but logged in
							console.log("not in cache, but logged in");
							addUserToCache(userInfo);
							initializePage(ws, userInfo);
						});
				})

				.catch((err: any) => {
					// TODO: handle login error
					console.log(`failed to login: ${err}`);
				});
		else {
			ws.send("missing token");
			ws.close();
		}
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
