import React, { useState } from "react";
import { connectSl } from "../../Api";
import {
	Input,
	Button
} from "@chakra-ui/react";

const ConnectivitySettings: React.FC<{ ws: any }> = ({ ws }) => {
	const [slToken, setSlToken] = useState('');
		return (
			<div	
				id="settings"
				style={{
					margin: "auto",
					textAlign: "center",
					width: '30%'
				}}
			>
				<Input onChange={(e)=> setSlToken(e.currentTarget.value)}  placeholder='Update Socket API' />
				<br />
				<br />
				<br />
				<Button onClick={() => connectSl(ws, slToken)} colorScheme='purple'>Save</Button>
			</div>
		);
}

export default ConnectivitySettings;
