const tmi = require("tmi.js");
const fs = require("fs");
const WebSocket = require("ws");
const io = require("socket.io-client");
const axios = require("axios");

var socket;
const port = 3001;
const portWss = 3003;
const wss = new WebSocket.Server({ port: portWss });
const client_id = "3qy8w6q7u5u7wamjmggmykmrv3wjj9";
var db = {};

var settings,
	timer = 0,
	readableTime = "0:00:00",
	settings,
	sync = false,
	timeout = 5,
	forceSync = 30;

function addToTimer(ws, seconds) {
	amount = parseInt(seconds) || 0;
	ws.timer += amount;
	syncTimer(ws);
}

function startTMI(ws) {
	console.log("connecting to", ws.name);
	const client = new tmi.Client({
		connection: {
			reconnect: true,
		},
		channels: [ws.name],
	});

	client.connect();

	client.on(
		"subgift",
		(channel, username, streakMonths, recipient, methods, userstate) => {
			var plan = userstate["msg-param-sub-plan"];
			var tier = plan == "Prime" ? 1 : plan / 1000;
			// addToTimer(, ws);
		}
	);

	client.on("anongiftpaidupgrade", (channel, username, userstate) => {
		var plan = userstate["msg-param-sub-plan"];
		addToTimer(plan == "Prime" ? 1 : plan / 1000, ws);
	});

	client.on("cheer", (channel, userstate, message) => {
		addToTimer("bits", parseFloat(userstate["bits"]), ws);
	});

	client.on(
		"resub",
		(channel, username, months, message, userstate, methods) => {
			var plan = userstate["msg-param-sub-plan"];
			addToTimer(plan == "Prime" ? 1 : plan / 1000, ws);
		}
	);

	client.on("subscription", (channel, username, method, message, userstate) => {
		var plan = userstate["msg-param-sub-plan"];
		addToTimer(plan == "Prime" ? 1 : plan, ws);
	});
}

function connectStreamlabs(ws) {
	if (ws.socket) {
		ws.socket.disconnect();
	}

	ws.socket = io.connect(
		`https://sockets.streamlabs.com?token=${ws.streamlabsToken}`,
		{
			reconnect: true,
			transports: ["websocket"],
		}
	);

	ws.socket.on("event", (e) => {
		if (e.type == "donation") {
			var amount = 1 * e.message[0].amount * ws.dollar;
			console.log(`adding ${amount} to ${ws.name}`);
			ws.timer += amount;
			syncTimer(ws);
		}
	});
}

function lowerTimer(ws) {
	if (ws.timer > 0) {
		ws.timer -= 1;
		ws.readableTime =
			Math.floor(timer / 3600) +
			":" +
			("0" + (Math.floor(timer / 60) % 60)).slice(-2) +
			":" +
			("0" + (timer % 60)).slice(-2);
	}
}

async function syncTimer(ws) {
	if (!Number.isInteger(ws.timer)) ws.timer = 0;
	ws.send(
		JSON.stringify({
			time: parseInt(ws.timer),
			sub: ws.sub,
			dollar: ws.dollar,
		})
	);
}

async function login(ws, data) {
	ws.access_token = data.access_token;
	axios
		.get(`https://api.twitch.tv/helix/users`, {
			headers: {
				Authorization: `Bearer ${ws.access_token}`,
				"Client-Id": client_id,
			},
		})
		.then((res) => {
			append = {
				name: res.data.data[0].login,
				initialized: true,
				id: res.data.data[0].id,
			};
			Object.assign(ws, append);
			if (!db[ws.name]) db[ws.name] = ws;
			getSettings(ws);
			setInterval(() => {
				pushToDb(ws);
			}, 30 * 1000);
			startTMI(ws);
		})
		.catch(function (error) {
			sendError(ws, "failed to login");
		});
}

async function getSettings(ws) {
	if (db[ws.name]) {
		ws.timer = db[ws.name].timer || 0;
		ws.sub = db[ws.name].sub || 60;
		ws.dollar = db[ws.name].dollar || 12;
		ws.streamlabsToken = db[ws.name].streamlabsToken || null;
	}
	if (ws.streamlabsToken) connectStreamlabs(ws);
}

async function pushToDb(ws) {
	db[ws.name] = ws;
}

async function sendError(ws, message) {
	ws.send(
		JSON.stringify({
			error: message,
		})
	);
}

function main() {
	wss.on("connection", (ws) => {
		setInterval(() => {
			lowerTimer(ws);
		}, 1000);

		ws.onmessage = function (event) {
			try {
				data = JSON.parse(event.data);
			} catch (error) {
				ws.send(
					JSON.stringify({
						error: "json error",
					})
				);
				return 0;
			}

			switch (data.event) {
				case "login":
					login(ws, data);
					break;
				case "connectStreamlabs":
					if (!ws.initialized) {
						sendError(ws, "not initialized");
						return 0;
					}
					ws.streamlabsToken = data.streamlabs_token;
					connectStreamlabs(ws);
					break;
				case "getTime":
					if (!ws.initialized) {
						sendError(ws, "not initialized");
						return 0;
					}
					syncTimer(ws);
					break;
				case "setSetting":
					if (!ws.initialized) {
						sendError(ws, "not initialized");
						return 0;
					}
					ws[data.setting] = data.value;
			}
		};
	});
}

main();
