import React, { useEffect, useState } from "react";
import ConnectivitySettings from "./Settings/Connectivity";
import Timer from "../Timer";
import * as consts from "../Consts";
import TimingSettings from "./Settings/TimingSettings";
import ChangeTime from "./Settings/ChangeTime";
import {
	Spinner,
	Tabs,
	TabList,
	TabPanels,
	Tab,
	TabPanel,
	Button,
	Center,
} from "@chakra-ui/react";

const URL = consts.URL;
let ws: WebSocket;

const Settings: React.FC = () => {
	const [settings, setSettings] = useState({});
	const [seconds, setSeconds] = useState(0);
	const [fetched, setFetched] = useState(false);

	const token = new URLSearchParams(window.location.search).get("token");

	const connectWs = () => {
		console.log("called");
		ws = new WebSocket(`${URL}?token=${token}`);

		ws.onmessage = (event: any) => {
			const response = JSON.parse(event.data);
			console.log(`received ${event.data}`);
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

	if (fetched)
		return (
			<div
				style={{
					margin: "auto",
					textAlign: "center",
					width: "40%",
					marginTop: "0%",
				}}
			>
				<Timer input_seconds={seconds} textAlign='center' />
				<br />
				<Tabs>
					<TabList>
						<Tab>Timer Settings</Tab>
						<Tab>Connect Streamlabs</Tab>
						<Tab>Change Time</Tab>
					</TabList>
					<br />
					<br />
					<TabPanels>
						<TabPanel>
							<TimingSettings ws={ws} input_settings={settings} />
						</TabPanel>
						<TabPanel>
							<ConnectivitySettings ws={ws} settings={settings} />
						</TabPanel>
						<TabPanel>
							<ChangeTime ws={ws} />
						</TabPanel>
					</TabPanels>
				</Tabs>
				<Center>
					<Button
						colorScheme='purple'
						onClick={() => {
							navigator.clipboard.writeText(
								`http://localhost:5173/widget?token=${token}`
							);
						}}
					>
						Copy widget URL
					</Button>
				</Center>
			</div>
		);

	return (
		<div
			style={{
				margin: "auto",
				textAlign: "center",
				width: "50%",
				marginTop: "3%",
			}}
		>
			<Spinner
				thickness='4px'
				speed='0.65s'
				emptyColor='gray.200'
				color='blue.500'
				size='xl'
			></Spinner>
			<br />
			Loading
		</div>
	);
};

export default Settings;
