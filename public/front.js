var timer = 0,
	readableTime,
	set = false;

var timerDiv = document.getElementById("timer");

function connect() {
	var ws = new WebSocket("wss://api.lobomfz.com/socket");
	ws.onopen = function (e) {
		console.log("Connection established");
	};

	ws.onmessage = function (event) {
		console.log("received ", event.data);
		response = JSON.parse(event.data);
		if ("time" in response) {
			timer = response.time;
			if (!set) {
				readableTime =
					Math.floor(timer / 3600) +
					":" +
					("0" + (Math.floor(timer / 60) % 60)).slice(-2) +
					":" +
					("0" + (timer % 60)).slice(-2);
				timerDiv.innerHTML = readableTime;
				document.getElementById("timerInput").value = readableTime;
				document.getElementById("subInput").value = response.tier_1;
				document.getElementById("dollarValue").value = response.dollar;
				set = true;
			}
		}
		if ("addTime" in response) {
			timer += response.addTime;
		}
		if ("removeTime" in response) {
			timer -= response.removeTime;
		}
		if ("error" in response) {
			console.log("error:", response.data);
		}
	};

	ws.onclose = function (e) {
		console.log(
			"Socket is closed. Reconnect will be attempted in 5 seconds.",
			e.reason
		);
		setTimeout(function () {
			connect();
		}, 5000);
	};

	ws.onerror = function (err) {
		console.error("Socket encountered error: ", err.message, "Closing socket");
		ws.close();
	};
}

function lowerTimer() {
	if (timer > 0) {
		timer -= 1;
	}

	readableTime =
		Math.floor(timer / 3600) +
		":" +
		("0" + (Math.floor(timer / 60) % 60)).slice(-2) +
		":" +
		("0" + (timer % 60)).slice(-2);
	timerDiv.innerHTML = readableTime;
}

connect();
setInterval(lowerTimer, 1000);
