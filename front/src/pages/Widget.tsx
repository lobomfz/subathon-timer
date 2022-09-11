import Timer from "../Timer";
import React, { useEffect, useState } from "react";
import * as consts from "../Consts";

const URL = consts.URL;
let ws: WebSocket;

const Widget: React.FC = () => {
	const [seconds, setSeconds] = useState(0);

	const [fetched, setFetched] = useState(false);

	const connectWs = () => {
		console.log("called");
		ws = new WebSocket(`${URL}?token=${token}`);

		ws.onmessage = (event: any) => {
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

	// bug: if zero then updated it doesnt decrease on screen
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

	const token = new URLSearchParams(window.location.search).get("token");
	if (token)
		return (
			<div>
				<Timer input_seconds={seconds} textAlign='start' color='white' />
			</div>
		);
	else return <div>Invalid URL</div>;
};

export default Widget;
