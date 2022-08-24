const tmi = require("tmi.js");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const WebSocket = require("ws");
const io = require("socket.io-client");

var socket;
const port = 3001;
const portWss = 3002;
const wss = new WebSocket.Server({ port: portWss });

var settings,
	timer = 0,
	readableTime = "0:00:00",
	settings,
	sync = false,
	timeout = 5,
	forceSync = 30;
lastMessage = Date.now() / 1000;

function readSettings() {
	try {
		var jsonFile = fs.readFileSync("./settings.json").toString();
	} catch (e) {
		console.log("Could not load json file!");
		process.exit();
	}
	try {
		settings = JSON.parse(jsonFile);
		timer = settings.seconds;
	} catch (e) {
		console.log(e);
		console.log("Failed to parse json");
		process.exit();
	}
}

function addToTimer(type, count = 1, extra) {
	amount = settings[type] * count;
	console.log("adding", amount, "seconds to timer");
	timer += amount;
	sync = false;
}

function httpApi() {
	const app = express();
	app.use(cors());
	app.listen(port, () => console.log(`listening on port ${port}`));

	app.post("/addTime", (req, res) => {
		if (req.headers.password == settings.password) {
			timer += parseInt(req.headers.seconds);
			sync = false;
			console.log("Added " + req.headers.seconds + " seconds to timer");
			res.send(
				JSON.stringify({
					message: "Added " + req.headers.seconds + " seconds to timer",
				})
			);
		} else {
			res.status(403);
			res.send(JSON.stringify({ error: "invalid password" }));
		}
	});

	app.post("/setTime", (req, res) => {
		if (req.headers.password == settings.password) {
			timer = parseInt(req.headers.seconds);
			sync = false;
			res.send("Set timer to " + req.headers.seconds + " seconds");
		} else {
			res.status(403);
			res.send(JSON.stringify({ error: "invalid password" }));
		}
	});

	app.get("/getTime", (req, res) => {
		res.send(readableTime);
	});

	app.post("/setToken", (req, res) => {
		if (req.headers.password == settings.password) {
			settings.socket_token = req.headers.sltoken;
			socket.disconnect();
			writeSettings();
			connectStreamlabs();
		} else {
			res.status(403);
			res.send(JSON.stringify({ error: "invalid password" }));
		}
	});

	app.post("/setSubTime", (req, res) => {
		if (req.headers.password == settings.password) {
			value = parseInt(req.headers.value);
			settings[1] = value;
			settings[2] = value * 2;
			settings[3] = value * 5;
			writeSettings();
		} else {
			res.status(403);
			res.send(JSON.stringify({ error: "invalid password" }));
		}
	});

	app.post("/setDollarValue", (req, res) => {
		console.log(req.headers.password);
		if (req.headers.password == settings.password) {
			value = parseInt(req.headers.value);
			settings.bits = value / 100;
			settings.dollar = value;
			settings.dollar = value;
			writeSettings();
		} else {
			res.status(403);
			res.send(JSON.stringify({ error: "invalid password" }));
		}
	});
}

function startTMI() {
	const client = new tmi.Client({
		connection: {
			reconnect: true,
		},
		channels: [settings.channel_name],
	});

	client.connect();

	client.on(
		"subgift",
		(channel, username, streakMonths, recipient, methods, userstate) => {
			var plan = userstate["msg-param-sub-plan"];
			addToTimer(plan == "Prime" ? 1 : plan / 1000);
		}
	);

	client.on("anongiftpaidupgrade", (channel, username, userstate) => {
		var plan = userstate["msg-param-sub-plan"];
		addToTimer(plan == "Prime" ? 1 : plan / 1000);
	});

	client.on("cheer", (channel, userstate, message) => {
		addToTimer("bits", parseFloat(userstate["bits"]));
	});

	client.on(
		"resub",
		(channel, username, months, message, userstate, methods) => {
			var plan = userstate["msg-param-sub-plan"];
			addToTimer(plan == "Prime" ? 1 : plan / 1000);
		}
	);

	client.on("subscription", (channel, username, method, message, userstate) => {
		var plan = userstate["msg-param-sub-plan"];
		addToTimer(plan == "Prime" ? 1 : plan);
	});
}

async function writeSettings() {
	settings.seconds = timer;
	await fs.promises.writeFile(
		"./settings.json",
		JSON.stringify(settings, null, 4),
		"UTF-8"
	);
}

function connectStreamlabs() {
	socket = io.connect(
		`https://sockets.streamlabs.com?token=${settings.socket_token}`,
		{
			reconnect: true,
			transports: ["websocket"],
		}
	);

	socket.on("event", (e) => {
		console.log(new Date(), "\n", e);
		if (e.type == "donation") {
			var amount =
				settings.currencies[e.message[0].currency] *
				e.message[0].amount *
				settings.dollar;
			console.log("adding", amount, "seconds to timer");
			timer += amount;

			sync = false;
		}
	});
}

function lowerTimer() {
	if (timer > 0) {
		timer -= 1;

		readableTime =
			Math.floor(timer / 3600) +
			":" +
			("0" + (Math.floor(timer / 60) % 60)).slice(-2) +
			":" +
			("0" + (timer % 60)).slice(-2);
	}
}

function connectFront() {
	wss.on("connection", (ws) => {
		async function syncTimer() {
			now = Date.now() / 1000;
			if (now - lastMessage < timeout) return 0;
			lastMessage = now;
			console.log(new Date(), "- syncing:", readableTime);
			ws.send(
				JSON.stringify({
					time: timer,
					tier_1: settings[1],
					dollar: settings.dollar,
				})
			);
		}

		setInterval(() => {
			if (!sync) syncTimer();
		}, 2000);

		// force sync every n seconds
		setInterval(() => {
			syncTimer();
		}, forceSync * 1000);

		ws.onmessage = function (event) {
			console.log(event.data);
			if (event.data == 1) sync = true;
			else sync = false;
			console.log(new Date(), "- synced:", readableTime);
		};
	});
}
function main() {
	readSettings();

	setInterval(lowerTimer, 1000);
	setInterval(writeSettings, 10 * 1000);

	httpApi();

	// twitch listeners
	startTMI();
	connectStreamlabs();

	connectFront();
}

main();
