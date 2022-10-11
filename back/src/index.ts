import url from "url";
import WebSocket from "ws";
import { wsType } from "./types";
import { portWss, pages } from "./config/serverSettings";
import { defaultValues } from "./config/userSettings";
import { initializePage } from "./timer/setup";
import { tryToLoadUserFromCache, createUserToCache } from "./cache/cache";
import { getUserInfo } from "./connections/twitch";
import { createUserToDb, loadUserFromDb } from "./database/interactions";

const wss = new WebSocket.Server({ port: portWss });

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

		// TODO: make this easier to read

		getUserInfo(token)
			.then((userInfo: any) => {
				tryToLoadUserFromCache(userInfo.userId)
					.then(([loaded, res]: any) => {
						// if loaded from cache
						if (loaded) initializePage(ws, res);
						// if not in cache:
						else {
							// try to load from db
							loadUserFromDb(userInfo.userId)
								.then(([loaded, userConfigs]: any) => {
									// if loaded from db
									if (loaded) initializePage(ws, userConfigs);
									// if not in db, create new user:
									else {
										createUserToCache(userInfo);
										createUserToDb(userInfo);
										initializePage(ws, userInfo);
									}
								})
								.catch((err) => {
									console.log(`error in loadUserFromDb: ${err}`);
								});
						}
					})
					.catch((err) => {
						console.log(`error in tryToLoadUserFromCache: ${err}`);
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
