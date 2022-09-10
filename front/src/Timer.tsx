import React, { useEffect, useState } from "react";

const Timer: React.FC<{ ws: WebSocket; textAlign: any }> = ({
	ws,
	textAlign = "center",
}) => {
	const [seconds, setSeconds] = useState(0);
	const [fetched, setFetched] = useState(false);

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
			className='Timer'
			style={{
				color: "black",
				fontFamily: "Roboto, sans-serif",
				fontSize: "128px",
				fontWeight: 400,
				textAlign: textAlign,
			}}
		>
			{timer}
		</div>
	);
};

export default Timer;
