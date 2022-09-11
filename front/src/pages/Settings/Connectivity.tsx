import React, { useState } from "react";
import { connectSl } from "../../Api";
import { Input, Button, Grid, GridItem } from "@chakra-ui/react";

const ConnectivitySettings: React.FC<{ ws: any }> = ({ ws }) => {
	const [slToken, setSlToken] = useState("");
	return (
		<div
			id='settings'
			style={{
				margin: "auto",
				textAlign: "center",
				width: "80%",
			}}
		>
			<Grid templateColumns='repeat(6, 1fr)' gap={8}>
				<GridItem colSpan={5}>
					<Input
						onChange={(e) => setSlToken(e.currentTarget.value)}
						placeholder='Update Streamlabs Socket API'
					/>
				</GridItem>
				<GridItem colSpan={1}>
					<Button
						colorScheme='purple'
						onClick={() =>
							window.open(
								"https://streamlabs.com/dashboard#/settings/api-settings",
								"_blank"
							)
						}
					>
						Get Token
					</Button>
				</GridItem>
			</Grid>
			<br />
			<br />
			<br />
			<Button onClick={() => connectSl(ws, slToken)} colorScheme='purple'>
				Save
			</Button>
		</div>
	);
};

export default ConnectivitySettings;
