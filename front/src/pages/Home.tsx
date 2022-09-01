import React from "react";
import * as consts from "../Consts";
import { Button, ButtonGroup } from "@chakra-ui/react";

const Home: React.FC = () => {
	// please make this look good
	return (
		<div
			style={{
				marginTop: "10px",
				margin: "auto",
				textAlign: "center",
				color: "white",
				fontFamily: "Roboto, sans-serif",
				fontWeight: 400,
				fontSize: "64px",
			}}
		>
			<Button colorScheme="purple" size="lg">
				<a
					href={`https://id.twitch.tv/oauth2/authorize?client_id=${consts.client_id}&redirect_uri=${consts.redirect_uri}login&response_type=token`}
				>
					login with twitch
				</a>
			</Button>
		</div>
	);
};

export default Home;
