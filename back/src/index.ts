import { createUser, Users } from "./db.js";
import axios from "axios";
import url from "url";
import tmi from "tmi.js";
import WebSocket from "ws";
import io from "socket.io-client";
import { user, wsType } from "./types.js";

const portWss = 3003;
const wss = new WebSocket.Server({ port: portWss });
const client_id: string = process.env.CLIENT_ID || "";
const pages: Array<string> = ["settings", "widget"];

const defaultValues = {
	sub: 60,
	dollar: 15,
	pushFrequency: 1,
	timeoutTime: 30,
	widgetSyncFrequency: 1,
};

function addToEndTime(ws: wsType, seconds: number) {
	ws.endTime += seconds;
	console.log(`adding ${seconds} to ${ws.name}`);
	syncTimer(ws);
}

function startTMI(ws: wsType) {
	console.log(`Connecting to ${ws.name} tmi`);
	const client = new tmi.Client({
		connection: {
			reconnect: true,
		},
		channels: [ws.name],
	});

	var aliveCheck = setInterval(() => {
		if (!ws.isAlive) {
			console.log(`disconnecting from ${ws.name}`);
			client.disconnect();
			clearInterval(aliveCheck);
			return 0;
		}
	}, 1000);

	client.connect();

	client.on(
		"subgift",
		(channel, username, streakMonths, recipient, methods, userstate) => {
			var plan: string = userstate["msg-param-sub-plan"] || "";
			addToEndTime(
				ws,
				(plan == "Prime" ? 1 : parseInt(plan) / 1000) * ws.subTime
			);
		}
	);

	client.on("anongiftpaidupgrade", (_channel, _username, userstate) => {
		var plan: string = userstate["msg-param-sub-plan"] || "";
		addToEndTime(
			ws,
			(plan == "Prime" ? 1 : parseInt(plan) / 1000) * ws.subTime
		);
	});

	client.on("cheer", (_channel, userstate, _message) => {
		var bits: string = userstate["bits"] || "";
		addToEndTime(ws, (parseInt(bits) / 100) * ws.dollarTime);
	});

	client.on(
		"resub",
		(_channel, _username, _months, _message, userstate, _methods) => {
			var plan: string = userstate["msg-param-sub-plan"] || "";
			addToEndTime(
				ws,
				(plan == "Prime" ? 1 : parseInt(plan) / 1000) * ws.subTime
			);
		}
	);

	client.on(
		"subscription",
		(_channel, _username, _method, _message, userstate) => {
			var plan: string = userstate["msg-param-sub-plan"] || "";
			addToEndTime(
				ws,
				(plan == "Prime" ? 1 : parseInt(plan) / 1000) * ws.subTime
			);
		}
	);
}

function connectStreamlabs(ws: wsType) {
	if (ws.socket) ws.socket.disconnect();

	console.log(`connecting to ${ws.name} sl`);

	var aliveCheck = setInterval(() => {
		if (!ws.isAlive) {
			ws.socket.disconnect();
			clearInterval(aliveCheck);
			return 0;
		}
	}, 1000);

	ws.socket = io(`https://sockets.streamlabs.com?token=${ws.slToken}`, {
		transports: ["websocket"],
	});

	ws.socket.on("connect", () => {
		console.log(`connected to ${ws.name} sl`);
		ws.slStatus = true;
		syncTimer(ws);
	});

	ws.socket.on("disconnect", () => {
		ws.slStatus = false;
	});

	ws.socket.on("event", (e: any) => {
		if (e.type == "donation") {
			var amount = e.message[0].amount * ws.dollarTime;
			addToEndTime(ws, amount);
		}
	});
}

async function syncTimer(ws: wsType) {
	ws.send(
		JSON.stringify({
			success: true,
			endTime: ws.endTime,
			subTime: ws.subTime,
			dollarTime: ws.dollarTime,
			slStatus: ws.slStatus,
		})
	);
	pushToDb(ws);
}

async function login(ws: wsType, accessToken: string) {
	ws.slStatus = false;
	axios
		.get(`https://api.twitch.tv/helix/users`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Client-Id": client_id,
			},
		})
		.then((httpRes) => {
			ws.userId = httpRes.data.data[0].id;
			ws.name = httpRes.data.data[0].login;

			Users.findByPk(ws.userId).then((res: any) => {
				if (!res) {
					var newUser: user = {
						userId: ws.userId,
						name: ws.name,
						accessToken: accessToken,
						subTime: defaultValues.sub,
						dollarTime: defaultValues.dollar,
						endTime: 0,
					};
					Object.assign(ws, newUser);
					createUser(newUser);
					ws.initialized = true;
					startTMI(ws);
				} else {
					Object.assign(ws, res.dataValues);
					if (ws.slToken) connectStreamlabs(ws);
					else syncTimer(ws);
					startTMI(ws);
				}
			});
		})
		.catch(function (error) {
			sendError(ws, "failed to login" + error);
			return 0;
		});
}

async function pushToDb(ws: wsType) {
	if (ws.userId && ws.type !== "widget") {
		Users.update(
			{
				name: ws.name,
				accessToken: ws.accessToken,
				subTime: ws.subTime,
				dollarTime: ws.dollarTime,
				slToken: ws.slToken,
				endTime: ws.endTime,
			},
			{
				where: {
					userId: ws.userId,
				},
			}
		);
	}
}

async function sendError(ws: wsType, message: string) {
	ws.send(
		JSON.stringify({
			error: message,
		})
	);
}

function heartbeat(ws: wsType) {
	ws.isAlive = true;
}

function updateSetting(ws: wsType, data: any) {
	switch (data.setting) {
		case "subTime":
			console.log(`setting ${ws.name} sub time to`, parseInt(data.value) || 60);
			ws.subTime = parseInt(data.value) || 60;
			break;
		case "dollarTime":
			console.log(
				`setting ${ws.name} dollar time to`,
				parseInt(data.value) || 60
			);
			ws.dollarTime = parseInt(data.value) || 15;
			break;
	}
}

function syncWidget(ws: wsType) {
	Users.findByPk(ws.userId).then((res: any) => {
		if (ws.endTime !== res.dataValues.endTime) {
			ws.endTime = res.dataValues.endTime;
			syncTimer(ws);
		}
	});
}

function main() {
	wss.on("connection", (ws: wsType, req: any) => {
		ws.isAlive = true;
		ws.on("pong", () => heartbeat(ws));
		var urlParams = url.parse(req.url, true).query;
		if (urlParams.token) {
			try {
				login(ws, urlParams.token as string);
			} catch (error) {
				sendError(ws, "invalid token.");
				return 0;
			}
		}

		if (
			typeof urlParams["page"] == "string" &&
			pages.includes(urlParams["page"])
		)
			ws.type = urlParams["page"];

		if (ws.type == "widget")
			var updateWidget = setInterval(
				() => syncWidget(ws),
				defaultValues.widgetSyncFrequency * 1000
			);

		ws.on("close", () => {
			ws.isAlive = false;
			console.log(`Disconnected from ${ws.name}`);
			clearInterval(updateWidget);
		});

		ws.onmessage = function (event: any) {
			try {
				var data = JSON.parse(event.data);
			} catch (error) {
				sendError(ws, "json error");
				return 0;
			}

			switch (data.event) {
				case "getTime":
					syncTimer(ws);
					break;
				case "connectStreamlabs":
					if (data.slToken.length < 200) ws.slToken = data.slToken;
					pushToDb(ws);
					connectStreamlabs(ws);
					break;
				case "setSetting":
					updateSetting(ws, data);
					pushToDb(ws);
					break;
				case "setEndTime":
					ws.endTime = parseInt(data.value) || 0;
					pushToDb(ws);
					syncTimer(ws);
					break;
			}
		};
	});

	const timeout = setInterval(function ping() {
		wss.clients.forEach(function each(ws: any) {
			if (ws.isAlive === false) return ws.terminate();
			console.log(
				`pinging ${ws.name} at ${ws.endTime - Math.trunc(Date.now() / 1000)}`
			);

			ws.isAlive = false;
			ws.ping();
		});
	}, defaultValues.timeoutTime * 1000);

	wss.on("close", function close() {
		clearInterval(timeout);
	});
}

main();
