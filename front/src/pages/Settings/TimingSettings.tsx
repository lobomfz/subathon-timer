import React, { useEffect, useState } from "react";
import {
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	NumberIncrementStepper,
	NumberDecrementStepper,
	InputGroup,
	InputLeftAddon,
	Spinner,
	Button,
	SimpleGrid,
} from "@chakra-ui/react";
import { setSettings } from "../../Api";

const TimingSettings: React.FC<{ ws: any; input_settings: any }> = ({
	ws,
	input_settings,
}) => {
	const [fetched, setFetched] = useState(false);
	const [SubTime, setSubTime] = useState(0);
	const [DollarTime, setDollarTime] = useState(0);

	const pushUpdates = () => {
		setSettings(ws, { subTime: SubTime, dollarTime: DollarTime });
	};

	useEffect(() => {
		if (typeof input_settings.subTime == "number") {
			setFetched(true);
			setSubTime(input_settings.subTime);
			setDollarTime(input_settings.dollarTime);
		}
	}, [input_settings]);

	if (fetched)
		return (
			<div
				id='TimingSettings'
				style={{
					margin: "auto",
					textAlign: "center",
					width: "80%",
				}}
			>
				<SimpleGrid columns={2} spacing={10}>
					<InputGroup>
						<InputLeftAddon children='Seconds per sub' />
						<NumberInput
							value={SubTime}
							onChange={(value) => setSubTime(parseInt(value) || 0)}
						>
							<NumberInputField />
							<NumberInputStepper>
								<NumberIncrementStepper />
								<NumberDecrementStepper />
							</NumberInputStepper>
						</NumberInput>
					</InputGroup>
					<InputGroup>
						<InputLeftAddon children='Seconds per $1' />
						<NumberInput
							value={DollarTime}
							onChange={(value) => setDollarTime(parseInt(value) || 0)}
						>
							<NumberInputField />
							<NumberInputStepper>
								<NumberIncrementStepper />
								<NumberDecrementStepper />
							</NumberInputStepper>
						</NumberInput>
					</InputGroup>
				</SimpleGrid>
				<br />
				<br />
				<br />
				<Button onClick={pushUpdates} colorScheme='purple'>
					Save
				</Button>
			</div>
		);
	else
		return (
			<div
				style={{
					margin: "auto",
					textAlign: "center",
					width: "30%",
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

export default TimingSettings;
