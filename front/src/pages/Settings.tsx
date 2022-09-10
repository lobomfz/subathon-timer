import React, { useEffect, useState } from "react";
import ConnectivitySettings from "./Settings/Connectivity";

const URL = "ws://localhost:3003";
let ws: WebSocket;

const Settings: React.FC = () => {
	const [seconds, setSeconds] = useState(0);
	const [fetched, setFetched] = useState(false);
	const [slToken, setSlToken] = useState('');
	const token = new URLSearchParams(window.location.search).get("token");
	const connectWs = () => {
		ws = new WebSocket(`${URL}?token=${token}`);
		ws.onopen = (event) => {
			console.log("websocket connection established");
		};

		ws.onmessage = (event) => {
			const response = JSON.parse(event.data);
			console.log(`received ${event.data}`);

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

	useEffect(() => {
		connectWs();
		return () => ws.close();
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			if (seconds > 0) {
				setSeconds((prev) => prev - 1);
			}
		}, 1000);
		return () => {
			clearInterval(interval);
		};
	}, [fetched]);

	const timer = `${Math.floor(seconds / 3600)}:${(
		"0" +
		(Math.floor(seconds / 60) % 60)
	).slice(-2)}:${("0" + (seconds % 60)).slice(-2)}`;

	return (
		<div>
			<div
				className="Timer"
				style={{
					color: "black",
					fontFamily: "Roboto, sans-serif",
					fontSize: "64px",
					fontWeight: 400,
					textAlign: "center",
				}}
			>
				{timer}
			</div>
			<br />
			<br />
			<ConnectivitySettings ws={ws}/>''
		</div>
	);
};

export default Settings;
