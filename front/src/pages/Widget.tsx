import Timer from "../Timer";

function Widget() {
	const token = new URLSearchParams(window.location.search).get("token");
	if (token)
		return (
			<div>
				<Timer token={token} />
			</div>
		);
	else return <div>Invalid URL</div>;
}

export default Widget;
