import axios from "axios";
import tmi from "tmi.js";
import { client_id } from "../config/serverSettings";
import { addToEndTime } from "../timer/operations";
import { getUserConfigs, userConfig } from "../cache/cache";

function addSub(userId: number, plan: string | undefined) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	if (typeof plan === undefined) return false;
	var tier = plan == "Prime" ? 1 : parseInt(plan as string) / 1000;

	return addToEndTime(userConfigs.userId, tier * userConfigs.subTime);
}

export function addDollar(userId: number, amount: number) {
	if (!userConfig.has(userId)) return false;
	var userConfigs = getUserConfigs(userId);

	return addToEndTime(userConfigs.userId, amount * userConfigs.dollarTime);
}

export function startTMI(name: string, userId: number) {
	console.log(`Connecting to ${name} tmi`);
	const client = new tmi.Client({
		connection: {
			reconnect: true,
		},
		channels: [name],
	});

	client.connect();

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
