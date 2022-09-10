import React, { useEffect, useState } from "react";
import ConnectivitySettings from "./Settings/Connectivity";
import Timer from "../Timer";
import * as consts from "../Consts";
import TimingSettings from "./Settings/TimingSettings";

const URL = consts.URL;
let ws: WebSocket;

const Settings: React.FC = () => {
	const [currentPage, setCurrentPage] = useState("Connectivity");
	const [settings, setSettings] = useState({});
	const [seconds, setSeconds] = useState(0);
	const [fetched, setFetched] = useState(false);

	const token = new URLSearchParams(window.location.search).get("token");

	const connectWs = () => {
		ws = new WebSocket(`${URL}?token=${token}`);

		ws.onmessage = (event: any) => {
			const response = JSON.parse(event.data);
			console.log(`received ${response}`);
			setSettings(response);

			if ("time" in response) {
				const time =
					typeof response.time === "number"
						? response.time
						: parseInt(response.time);
				setSeconds(time);
				if (!fetched) {
					setFetched(true);
				}
			} else if ("error" in response) {
				console.log(`error: ${response.data}`);
			}
		};

		ws.onclose = (event) => {
			console.log(
				`socket closed, attempting reconnect in 5 seconds... (${event.reason})`
			);
			setTimeout(connectWs, 5000);
		};

		ws.onerror = (event) => {
			console.error(`socket encountered error: ${event} - closing socket`);
			ws.close();
		};
	};

	connectWs();

	switch (currentPage) {
		case "Connectivity":
			return (
				<div>
					<Timer seconds={seconds} textAlign='center' />
					<br />
					<ConnectivitySettings ws={ws} />
				</div>
			);
			break;
		case "Timing":
			return (
				<div>
					<Timer seconds={seconds} textAlign='center' />
					<br />
					<TimingSettings ws={ws} settings={settings} />
				</div>
			);
			break;
	}

	return (
		<div>
			<Timer seconds={seconds} textAlign='center' />
		</div>
	);
};

export default Settings;
