import React, { useEffect, useState } from "react";
import { Input, Button } from "@chakra-ui/react";

const TimingSettings: React.FC<{ ws: any; settings: any }> = ({
	ws,
	settings,
}) => {
	const [subTime, setSubTime] = useState("");
	const pushUpdates = () => {
		console.log("button pressed");
	};

	useEffect(() => {
		if (settings.sub) setSubTime(settings.sub);
	}, [settings]);

	return (
		<div
			id='TimingSettings'
			style={{
				margin: "auto",
				textAlign: "center",
				width: "30%",
			}}
		>
			<Input
				onChange={(e) => setSubTime(e.currentTarget.value)}
				value={subTime}
			/>
			<br />
			<br />
			<br />
			<Button onClick={pushUpdates} colorScheme='purple'>
				Save
			</Button>
		</div>
	);
};

export default TimingSettings;
