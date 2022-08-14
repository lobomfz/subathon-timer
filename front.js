var timer = 0,
  readableTime;

var timerDiv = document.getElementById("timer");

function connect() {
  var ws = new WebSocket("ws://localhost:3002");
  ws.onopen = function (e) {
    console.log("Connection established");
  };

  ws.onmessage = function (event) {
    response = JSON.parse(event.data);
    if ("time" in response) {
      timer = response.time;
    }
    if ("addTime" in response) {
      timer += response.addTime;
    }
    if ("removeTime" in response) {
      timer -= response.removeTime;
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

    readableTime =
      Math.floor(timer / 3600) +
      ":" +
      ("0" + (Math.floor(timer / 60) % 60)).slice(-2) +
      ":" +
      ("0" + (timer % 60)).slice(-2);
    console.log(readableTime);
  }
  timerDiv.innerHTML = readableTime;
}

connect();
setInterval(lowerTimer, 1000);
