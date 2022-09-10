import React, { useEffect, useState } from "react";

var timer;

const Timer: React.FC<{ seconds: number; textAlign: any }> = ({
	seconds,
	textAlign = "center",
}) => {
	if (seconds > 0)
		timer = `${Math.floor(seconds / 3600)}:${(
			"0" +
			(Math.floor(seconds / 60) % 60)
		).slice(-2)}:${("0" + (seconds % 60)).slice(-2)}`;
	else timer = "00:00:00";

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
