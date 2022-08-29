const tmi = require("tmi.js");
const fs = require("fs");
const WebSocket = require("ws");
const io = require("socket.io-client");
const axios = require("axios");
const database = require("./db");

const port = 3001;
const portWss = 3003;
const wss = new WebSocket.Server({ port: portWss });
const client_id = "3qy8w6q7u5u7wamjmggmykmrv3wjj9";
var db = {};

const defaultValues = {
	sub: 60,
	dollar: 15,
	pushFrequency: 10,
};

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

	ws.socket = io.connect(`https://sockets.streamlabs.com?token=${ws.slToken}`, {
		reconnect: true,
		transports: ["websocket"],
	});

	ws.socket.on("event", (e) => {
		if (e.type == "donation") {
			var amount = 1 * e.message[0].amount * ws.dollar;
			console.log(`adding ${amount} to ${ws.name}`);
			addToTimer(ws, amount);
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
	axios
		.get(`https://api.twitch.tv/helix/users`, {
			headers: {
				Authorization: `Bearer ${data.accessToken}`,
				"Client-Id": client_id,
			},
		})
		.then((httpRes) => {
			ws.userId = httpRes.data.data[0].id;
			ws.name = httpRes.data.data[0].login;

			database.Users.findByPk(ws.userId).then((res) => {
				if (!res) {
					console.log();
					newUser = {
						userId: ws.userId,
						name: ws.name,
						accessToken: data.accessToken,
						sub: defaultValues.sub,
						dollar: defaultValues.dollar,
						timer: 0,
					};

					console.log(ws.accessToken);
					Object.assign(ws, newUser);
					database.createUser(newUser);
					ws.initialized = true;
					startTMI(ws);
				} else {
					console.log("loaded user", res.dataValues.name);
					ws.initialized = true;
					Object.assign(ws, res.dataValues);
				}
			});
		})
		.catch(function (error) {
			sendError(ws, "failed to login" + error);
			return 0;
		});
}

async function pushToDb(ws) {
	database.Users.update(
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
					setInterval(() => pushToDb(ws), defaultValues.pushFrequency * 1000);
					break;
				case "connectStreamlabs":
					if (!ws.initialized) {
						sendError(ws, "not initialized");
						return 0;
					}
					ws.slToken = data.slToken;
					pushToDb(ws);
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
					pushToDb(ws);
			}
		};
	});
}

main();
