import React, { useEffect, useState } from "react";
import ConnectivitySettings from "./Settings/Connectivity";
import Timer from "../Timer";
import * as consts from "../Consts";

const URL = consts.URL;
let ws: WebSocket;

const Settings: React.FC = () => {
	const [currentPage, setCurrentPage] = useState("Connectivity");

	const token = new URLSearchParams(window.location.search).get("token");

	const connectWs = () => {
		ws = new WebSocket(`${URL}?token=${token}`);

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
					<Timer ws={ws} textAlign='center' />
					<br />
					<ConnectivitySettings ws={ws} />
				</div>
			);
			break;
	}

	return (
		<div>
			<Timer ws={ws} textAlign='center' />
		</div>
	);
};

export default Settings;
