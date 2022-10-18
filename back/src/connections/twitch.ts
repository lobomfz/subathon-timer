import axios from "axios";
import tmi from "tmi.js";
import { client_id } from "../config/serverSettings";
import { addToEndTime } from "../timer/operations";
import { getUserConfigs, setUserKey, userIsInCache } from "../cache/cache";
import { defaultValues } from "../config/userSettings";

async function addSub(userId: number, plan: string | undefined) {
	if (!(await userIsInCache(userId))) return false;
	var userConfigs = await getUserConfigs(userId);

	if (typeof plan === undefined) return false;
	var tier = plan == "Prime" ? 1 : parseInt(plan as string) / 1000;

	return addToEndTime(userConfigs.userId, tier * userConfigs.subTime);
}

export async function addDollar(userId: number, amount: number) {
	if (!(await userIsInCache(userId))) return false;
	var userConfigs = await getUserConfigs(userId);

	return addToEndTime(userConfigs.userId, amount * userConfigs.dollarTime);
}

export async function startTMI(name: string, userId: number) {
	if (!(await userIsInCache(userId))) return false;
	var userConfigs = await getUserConfigs(userId);
	const client = new tmi.Client({
		connection: {
			reconnect: true,
		},
		channels: [name],
	});

	client.connect();

	const isAlive = setInterval(() => {
		if (!userIsInCache(userId)) {
			client.disconnect();
			clearInterval(isAlive);
		}
	}, defaultValues.checkForTimeout * 1000);

	client.on("connected", () => {
		console.log(`connected to ${userConfigs.name} tmi`);
		setUserKey(userId, "tmiAlive", true);
	});

	client.on("disconnected", () => {
		console.log(`disconnected from ${userConfigs.name} tmi`);
		setUserKey(userId, "tmiAlive", false);
	});

	client.on(
		"subgift",
		(channel, username, streakMonths, recipient, methods, userstate) => {
			addSub(userId, userstate["msg-param-sub-plan"]);
		}
	);

	client.on("anongiftpaidupgrade", (_channel, _username, userstate) => {
		addSub(userId, userstate["msg-param-sub-plan"]);
	});

	client.on(
		"resub",
		(_channel, _username, _months, _message, userstate, _methods) => {
			addSub(userId, userstate["msg-param-sub-plan"]);
		}
	);

	client.on(
		"subscription",
		(_channel, _username, _method, _message, userstate) => {
			addSub(userId, userstate["msg-param-sub-plan"]);
		}
	);

	client.on("message", (channel, tags, message, self) => {
		var mSplit = message.toLowerCase().split(" ");
		console.log(`message: ${message}`);

		switch (mSplit[0]) {
			case "!addsub":
				addSub(userId, "1000");
				break;
		}
	});

	client.on("cheer", (_channel, userstate, _message) => {
		addDollar(userId, parseInt(userstate["bits"] || "") / 100);
	});
}

export async function getUserInfo(accessToken: string) {
	return new Promise(function (resolve, reject) {
		axios
			.get(`https://api.twitch.tv/helix/users`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Client-Id": client_id,
				},
			})
			.then((httpRes) => {
				resolve({
					name: httpRes.data.data[0].login,
					userId: httpRes.data.data[0].id,
				});
			})
			.catch(function (error) {
				reject(error);
			});
	});
}
