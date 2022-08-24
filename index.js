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
	settingsJson,
	sync = 0;

function readSettings() {
	try {
		var jsonFile = fs.readFileSync("./settings.json").toString();
	} catch (e) {
		console.log("Could not load json file!");
		process.exit();
	}
	try {
		settingsJson = JSON.parse(jsonFile);

		// unnecessary
		settings = {
			channel_name: settingsJson["channel_name"],
			1: settingsJson["1"],
			2: settingsJson["2"],
			3: settingsJson["3"],
			bits: settingsJson["dollar"] / 100,
			dollar: settingsJson["dollar"],
			seconds: settingsJson["seconds"],
			currencies: settingsJson["currencies"],
			socket_token: settingsJson["socket_token"],
			password: settingsJson["password"],
		};

		timer = settings.seconds;
	} catch (e) {
		console.log(e);
		console.log("Failed to parse json");
		process.exit();
	}
}

function addToTimer(type, count = 1, extra) {
	amount = settings[type] * count;
	console.log("adding", amount, "to timer");
	timer += amount;
	sync = 0;
}

function initializeAPI() {
	const app = express();
	app.use(cors());
	app.listen(port, () => console.log(`listening on port ${port}`));

	// This will be used to adjust settings after i hate myself enough to create the frontend
	app.post("/addTime", (req, res) => {
		if (req.headers.password == settings.password) {
			timer += parseInt(req.headers.seconds);
			sync = 0;
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
			sync = 0;
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
			settingsJson.socket_token = req.headers.sltoken;
			socket.disconnect();
			writeSettings();
			slConnect();
		} else {
			res.status(403);
			res.send(JSON.stringify({ error: "invalid password" }));
		}
	});

	app.post("/setSubTime", (req, res) => {
		if (req.headers.password == settings.password) {
			value = parseInt(req.headers.value);

			settingsJson[1] = value;
			settings[1] = value;

			settingsJson[2] = value * 2;
			settings[2] = value * 2;

			settingsJson[3] = value * 6;
			settings[3] = value * 6;

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
			settingsJson.dollar = value;
			settings.dollar = value;
			writeSettings();
		} else {
			res.status(403);
			res.send(JSON.stringify({ error: "invalid password" }));
		}
	});
}

function eventListener() {
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
	settingsJson.seconds = timer;
	await fs.promises.writeFile(
		"./settings.json",
		JSON.stringify(settingsJson, null, 4),
		"UTF-8"
	);
	readSettings();
}

function slConnect() {
	console.log(`https://sockets.streamlabs.com?token=${settings.socket_token}`);
	socket = io.connect(
		`https://sockets.streamlabs.com?token=${settings.socket_token}`,
		{
			reconnect: true,
			transports: ["websocket"],
		}
	);

	socket.on("event", (e) => {
		if (!message) message = ""; // handles no message on donate
		var message = e.message[0].message;

		if (e.type == "donation") {
			var amount =
				settings.currencies[e.message[0].currency] *
				e.message[0].amount *
				settings.dollar;
			console.log("adding ", amount, "to timer");
			timer += amount;

			sync = 0;
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
		console.log(readableTime);
	}
}

function main() {
	readSettings();

	setInterval(lowerTimer, 1000);
	writeSettings();
	setInterval(writeSettings, 10 * 1000);

	initializeAPI();

	eventListener();
	slConnect();

	wss.on("connection", (ws) => {
		ws.send(
			JSON.stringify({
				time: timer,
				tier_1: settings[1],
				dollar: settings.dollar,
			})
		);

		setInterval(() => {
			if (sync == 0) {
				console.log("syncing time: ", timer);
				ws.send(JSON.stringify({ time: timer }));
				sync = 1;
			}
		}, 1000);
	});
}

main();
