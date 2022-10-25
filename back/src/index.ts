import url from "url";
import WebSocket from "ws";
import { userConfigsType, wsType } from "./types";
import { portWss, pages } from "./config/serverSettings";
import { defaultValues } from "./config/userSettings";
import { getUserInfo } from "./connections/twitch";
import { loadUser } from "./cache/cache";
import { initializePage } from "./timer/setup";

export const wss = new WebSocket.Server({ port: portWss });

function heartbeat(ws: wsType) {
	ws.isAlive = true;
}

// TODO: remove all redundant cache .get() calls

function main() {
	wss.on("connection", (ws: wsType, req: any) => {
		ws.isAlive = true;
		ws.frontInfo = {};
		ws.on("pong", () => heartbeat(ws));

		var urlParams = url.parse(req.url, true).query;

		ws.page =
			typeof urlParams["page"] == "string" && pages.includes(urlParams["page"])
				? urlParams["page"]
				: "other";

		var token = urlParams["token"]?.toString() || null;

		if (!token) {
			ws.send("missing token");
			ws.close();
			return;
		}

		getUserInfo(token)
			.then((userInfo: any) => {
				ws.userId = userInfo.userId;

				loadUser(userInfo.userId, userInfo.name).then((success: any) => {
					if (success) initializePage(ws, userInfo.userId);
				});
			})
			.catch((err: any) => {
				// TODO: handle login error
				console.log(`failed to login: ${err}`);
			});
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
