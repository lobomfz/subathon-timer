import axios from "axios";
import tmi from "tmi.js";
import { wsType, initialUser, currentUserType } from "../types";
import { client_id } from "../config/serverSettings";
import { Users } from "../database/interface";
import { createUser } from "../database/interactions";
import { connectStreamlabs } from "./streamlabs";
import { addToEndTime } from "../timer/operations";

function addSub(currentUser: currentUserType, plan: string | undefined) {
	if (typeof plan === undefined) return 0;
	var tier = plan == "Prime" ? 1 : parseInt(plan as string) / 1000;
	addToEndTime(currentUser, tier * currentUser.subTime);
}

export function startTMI(currentUser: currentUserType) {
	console.log(`Connecting to ${currentUser.name} tmi`);
	const client = new tmi.Client({
		connection: {
			reconnect: true,
		},
		channels: [currentUser.name],
	});

	var aliveCheck = setInterval(() => {
		if (!currentUser.isAlive) {
			console.log(`disconnecting from ${currentUser.name}`);
			client.disconnect();
			clearInterval(aliveCheck);
			return 0;
		}
	}, 1000);

	client.connect();

	client.on(
		"subgift",
		(channel, username, streakMonths, recipient, methods, userstate) => {
			addSub(currentUser, userstate["msg-param-sub-plan"]);
		}
	);

	client.on("anongiftpaidupgrade", (_channel, _username, userstate) => {
		addSub(currentUser, userstate["msg-param-sub-plan"]);
	});

	client.on(
		"resub",
		(_channel, _username, _months, _message, userstate, _methods) => {
			addSub(currentUser, userstate["msg-param-sub-plan"]);
		}
	);

	client.on(
		"subscription",
		(_channel, _username, _method, _message, userstate) => {
			addSub(currentUser, userstate["msg-param-sub-plan"]);
		}
	);

	client.on("cheer", (_channel, userstate, _message) => {
		addToEndTime(
			currentUser,
			(parseInt(userstate["bits"] || "") / 100) * currentUser.dollarTime
		);
	});
}

export async function login(ws: wsType, initialUser: initialUser) {
	return new Promise(function (resolve, reject) {
		axios
			.get(`https://api.twitch.tv/helix/users`, {
				headers: {
					Authorization: `Bearer ${initialUser.accessToken}`,
					"Client-Id": client_id,
				},
			})
			.then((httpRes) => {
				var currentUser: currentUserType = {
					page: initialUser.page,
					accessToken: initialUser.accessToken,
					name: httpRes.data.data[0].login,
					intervals: {},
					userId: httpRes.data.data[0].id,
					endTime: 0,
					subTime: 0,
					dollarTime: 0,
					slStatus: false,
					isAlive: true,
					send: (data: any) => {
						ws.send(data);
					},
				};

				Users.findByPk(httpRes.data.data[0].id).then((res: any) => {
					if (res) {
						console.log(`loading ${currentUser.name}`);
						Object.assign(currentUser, res.dataValues);
						if (currentUser.slToken) connectStreamlabs(currentUser);
						startTMI(currentUser);
						resolve(currentUser);
					} else {
						console.log(`creating new user ${currentUser.name}`);
						createUser(currentUser);
						resolve(currentUser);
						startTMI(currentUser);
					}
				});
			})
			.catch(function (error) {
				reject(error);
			});
	});
}
