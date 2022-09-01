import React, { useEffect, useState } from "react";

const URL = "ws://localhost:3003";
let ws: WebSocket;

const Timer: React.FC = () => {
	const [seconds, setSeconds] = useState(0);
	const [fetched, setFetched] = useState(false);
	const token = new URLSearchParams(window.location.hash.substring(1)).get(
		"access_token"
	);

	const updateSeconds = (endTime: number) =>
		setSeconds(Math.round(endTime - new Date().getTime() / 1000));

	const connectWs = () => {
		ws = new WebSocket(URL);

		ws.onopen = (event) => {
			console.log("websocket connection established");

			if (token)
				ws.send(
					JSON.stringify({
						event: "login",
						accessToken: token,
					})
				);
		};

		ws.onmessage = (event) => {
			const response = JSON.parse(event.data);
			console.log(`received ${event.data}`);

			if ("time" in response) {
				const endTime =
					typeof response.endTime === "number"
						? response.endTime
						: parseInt(response.endTime);
				updateSeconds(endTime);

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
		<div
			className="Timer"
			style={{
				color: "black",
				fontFamily: "Roboto, sans-serif",
				fontSize: "128px",
				fontWeight: 400,
			}}
		>
			{timer}
		</div>
	);
};

export default Timer;
