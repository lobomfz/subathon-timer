var endpoint = "https://api.lobomfz.com/timerApi";

window.addEventListener("load", () => {
	function addTime(seconds) {
		fetch(endpoint + "/addTime", {
			method: "POST",
			headers: {
				password: document.getElementById("apiPassword").value,
				seconds: seconds,
			},
		}).then((res) => {
			if (res.status == 403) {
				alert("error");
				return 0;
			}
			timer += seconds;
			res.json().then((data) => {
				console.log(data);
			});
		});
	}

	function setTime(seconds) {
		fetch(endpoint + "/setTime", {
			method: "POST",
			headers: {
				password: document.getElementById("apiPassword").value,
				seconds: seconds,
			},
		}).then((res) => {
			if (res.status == 200) {
				timer = seconds;
			} else {
				res.json().then((data) => {
					alert(data.error);
				});
			}
		});
	}

	function setSlToken(token) {
		fetch(endpoint + "/setToken", {
			method: "POST",
			headers: {
				password: document.getElementById("apiPassword").value,
				sltoken: token,
			},
		});
	}

	function setSubTime(seconds) {
		fetch(endpoint + "/setSubTime", {
			method: "POST",
			headers: {
				password: document.getElementById("apiPassword").value,
				value: seconds,
			},
		});
	}

	function setDollarValue(seconds) {
		fetch(endpoint + "/setDollarValue", {
			method: "POST",
			headers: {
				password: document.getElementById("apiPassword").value,
				value: seconds,
			},
		});
	}

	document.getElementById("addHours").addEventListener("submit", (event) => {
		event.preventDefault();
		addTime(parseInt(document.getElementById("hoursInput").value * 60 * 60));
	});

	document.getElementById("addMinutes").addEventListener("submit", (event) => {
		event.preventDefault();
		addTime(parseInt(document.getElementById("minutesInput").value * 60));
	});

	document.getElementById("addSeconds").addEventListener("submit", (event) => {
		event.preventDefault();
		addTime(parseInt(document.getElementById("secondsInput").value));
	});

	document.getElementById("setTime").addEventListener("submit", (event) => {
		event.preventDefault();
		var timeInput = document.getElementById("timerInput").value.split(":");
		setTime(
			parseInt(+timeInput[0] * 60 * 60 + +timeInput[1] * 60 + +timeInput[2])
		);
	});

	document.getElementById("slToken").addEventListener("submit", (event) => {
		event.preventDefault();
		setSlToken(document.getElementById("slTokenInput").value);
	});

	document.getElementById("subValue").addEventListener("submit", (event) => {
		event.preventDefault();
		setSubTime(document.getElementById("subInput").value);
	});

	document.getElementById("subValue").addEventListener("submit", (event) => {
		event.preventDefault();
		setSubTime(document.getElementById("subInput").value);
	});

	document.getElementById("dollar").addEventListener("submit", (event) => {
		event.preventDefault();
		setDollarValue(document.getElementById("dollarValue").value);
	});
});

function copyWidget() {
	navigator.clipboard.writeText("https://api.lobomfz.com/timer/widget.html");
}
