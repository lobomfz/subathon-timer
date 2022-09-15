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

const defaultValues = {
	sub: 60,
	dollar: 15,
	pushFrequency: 1,
	timeoutTime: 30,
};

function addToTimer(ws: wsType, seconds: number) {
	var amount = seconds || 0;
	ws.timer += amount;
	console.log(`adding ${amount} to ${ws.name}`);
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
			addToTimer(ws, (plan == "Prime" ? 1 : parseInt(plan) / 1000) * ws.sub);
		}
	);

	client.on("anongiftpaidupgrade", (_channel, _username, userstate) => {
		var plan: string = userstate["msg-param-sub-plan"] || "";
		addToTimer(ws, (plan == "Prime" ? 1 : parseInt(plan) / 1000) * ws.sub);
	});

	client.on("cheer", (_channel, userstate, _message) => {
		var bits: string = userstate["bits"] || "";
		addToTimer(ws, (parseInt(bits) / 100) * ws.dollar);
	});

	client.on(
		"resub",
		(_channel, _username, _months, _message, userstate, _methods) => {
			var plan: string = userstate["msg-param-sub-plan"] || "";
			addToTimer(ws, (plan == "Prime" ? 1 : parseInt(plan) / 1000) * ws.sub);
		}
	);

	client.on(
		"subscription",
		(_channel, _username, _method, _message, userstate) => {
			var plan: string = userstate["msg-param-sub-plan"] || "";
			addToTimer(ws, (plan == "Prime" ? 1 : parseInt(plan) / 1000) * ws.sub);
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
		ws.slStatus = true;
		syncTimer(ws);
	});

	ws.socket.on("disconnect", () => {
		ws.slStatus = false;
	});

	ws.socket.on("event", (e: any) => {
		if (e.type == "donation") {
			var amount = 1 * e.message[0].amount * ws.dollar;
			addToTimer(ws, amount);
		}
	});
}

function lowerTimer(ws: wsType) {
	if (ws.timer > 0) ws.timer -= 1;
	pushToDb(ws);
}

async function syncTimer(ws: wsType) {
	if (!Number.isInteger(ws.timer)) ws.timer = 0;
	if (!ws.slStatus) ws.slStatus = false;
	ws.send(
		JSON.stringify({
			success: true,
			time: ws.timer,
			sub: ws.sub,
			dollar: ws.dollar,
			slStatus: ws.slStatus,
		})
	);
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
						sub: defaultValues.sub,
						dollar: defaultValues.dollar,
						timer: 0,
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
	if (ws.userId)
		Users.update(
			{
				name: ws.name,
				accessToken: ws.accessToken,
				sub: ws.sub,
				dollar: ws.dollar,
				slToken: ws.slToken,
				timer: ws.timer,
			},
			{
				where: {
					userId: ws.userId,
				},
			}
		);
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
			ws.sub = parseInt(data.value) || 60;
			break;
		case "dollarTime":
			console.log(
				`setting ${ws.name} dollar time to`,
				parseInt(data.value) || 60
			);
			ws.dollar = parseInt(data.value) || 15;
			break;
	}
}

function main() {
	wss.on("connection", (ws: wsType, req: any) => {
		ws.isAlive = true;
		ws.on("pong", () => heartbeat(ws));

		if (url.parse(req.url, true).query.token) {
			try {
				login(ws, url.parse(req.url, true).query.token as string);
			} catch (error) {
				sendError(ws, "invalid token.");
				return 0;
			}
		}

		const timerInterval = setInterval(() => {
			lowerTimer(ws);
		}, 1000);

		ws.on("close", () => {
			ws.isAlive = false;
			console.log(`Disconnected from ${ws.name}`);
			clearInterval(timerInterval);
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
					ws.slToken = data.slToken;
					pushToDb(ws);
					connectStreamlabs(ws);
					break;
				case "setSetting":
					updateSetting(ws, data);
					pushToDb(ws);
					break;
				case "setTime":
					ws.timer = parseInt(data.value) || 0;
					pushToDb(ws);
					break;
				case "addTime":
					addToTimer(ws, data.value);
					break;
			}
		};
	});

	const timeout = setInterval(function ping() {
		wss.clients.forEach(function each(ws: any) {
			if (ws.isAlive === false) return ws.terminate();
			console.log(`pinging ${ws.name}`);

			ws.isAlive = false;
			ws.ping();
		});
	}, defaultValues.timeoutTime * 1000);

	wss.on("close", function close() {
		clearInterval(timeout);
	});
}

main();
