import url from "url";
import WebSocket from "ws";
import { wsType, currentUserType, initialUser } from "./types.js";
import { portWss, pages } from "./config/serverSettings.js";
import { defaultValues } from "./config/userSettings.js";
import { login } from "./connections/twitch.js";
import { sendError, syncTimer, frontListener } from "./connections/frontend.js";
import { initializePage, closePage } from "./timer/setup.js";

const wss = new WebSocket.Server({ port: portWss });

function heartbeat(ws: wsType) {
	ws.isAlive = true;
}

function main() {
	wss.on("connection", (ws: wsType, req: any) => {
		ws.isAlive = true;
		ws.on("pong", () => heartbeat(ws));

		var urlParams = url.parse(req.url, true).query;

		var currentUser: currentUserType;
		var initialUser: initialUser = {
			page:
				typeof urlParams["page"] == "string" &&
				pages.includes(urlParams["page"])
					? urlParams["page"]
					: "other",
			accessToken: urlParams["token"]?.toString() || "",
		};

		console.log(
			`New connection from ${initialUser.page}, token: ${initialUser.accessToken}`
		);

		login(ws, initialUser).then((res: any) => {
			if (res == 0) {
				sendError(ws as any, "invalid token.");
				return 0;
			}

			currentUser = res;

			initializePage(currentUser);
			syncTimer(currentUser);

			ws.on("close", () => {
				ws.isAlive = false;
				currentUser.isAlive = false;
				console.log(`Disconnected from ${ws.name}`);
				closePage(currentUser);
			});

			frontListener(ws, currentUser);
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
