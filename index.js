const tmi = require("tmi.js");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const WebSocket = require("ws");
const io = require("socket.io-client");

const port = 3001;
const portWss = 3002;
const wss = new WebSocket.Server({ port: portWss });

var settings,
  timer = 0,
  readableTime = "0:00:00",
  settingsJson,
  sync = 0;

function readSettings() {
  try {
    var jsonFile = fs.readFileSync("./settings.json").toString();
  } catch (e) {
    console.log("Could not load json file!");
    process.exit();
  }
  try {
    settingsJson = JSON.parse(jsonFile);

    // unnecessary
    settings = {
      channel_name: settingsJson["channel_name"],
      1: settingsJson["tier_1_sub"],
      2: settingsJson["tier_2_sub"],
      3: settingsJson["tier_3_sub"],
      bits: settingsJson["100_bits"] / 100,
      dollar: settingsJson["1_dollar"],
      seconds: settingsJson["seconds"],
      currencies: settingsJson["currencies"],
      socketToken: settingsJson["socket_token"],
    };

    timer = settings.seconds;
  } catch (e) {
    console.log(e);
    console.log("Failed to parse json");
    process.exit();
  }
}

function addToTimer(type, count = 1, extra) {
  amount = settings[type] * count;
  console.log("adding", amount, "to timer");
  timer += settings[type] * count;
  sync = 0;
}

function initializeAPI() {
  const app = express();
  app.use(cors());
  app.listen(port, () => console.log(`listening on port ${port}`));

  // This will be used to adjust settings after i hate myself enough to create the frontend
  app.post("/addTime", (req, res) => {
    timer += parseInt(req.headers.seconds);
    sync = 0;
    res.send("Added " + req.headers.seconds + " seconds to timer");
  });
  app.post("/removeTime", (req, res) => {
    timer -= parseInt(req.headers.seconds);
    sync = 0;
    res.send("Removed " + req.headers.seconds + " seconds from timer");
  });
  app.post("/setTime", (req, res) => {
    timer = parseInt(req.headers.seconds);
    sync = 0;
    res.send("Set timer to " + req.headers.seconds + " seconds");
  });
  app.get("/getTime", (req, res) => {
    res.send(readableTime);
  });
  app.post("/setConfig", (req, res) => {
    if (req.headers.config in settingsJson)
      settingsJson[req.headers.config] = parseInt(req.headers.value);

    res.send(`trying to set ${req.headers.config} to ${req.headers.value}`);
    writeTime();
  });
}

function eventListener() {
  const client = new tmi.Client({
    connection: {
      reconnect: true,
    },
    channels: [settings.channel_name],
  });

  client.connect();

  client.on(
    "subgift",
    (channel, username, streakMonths, recipient, methods, userstate) => {
      var plan = userstate["msg-param-sub-plan"];
      addToTimer(plan == "Prime" ? 1 : plan / 1000);
    }
  );

  client.on("anongiftpaidupgrade", (channel, username, userstate) => {
    var plan = userstate["msg-param-sub-plan"];
    addToTimer(plan == "Prime" ? 1 : plan / 1000);
  });

  client.on("cheer", (channel, userstate, message) => {
    addToTimer("bits", parseInt(userstate["bits"]));
  });

  client.on(
    "resub",
    (channel, username, months, message, userstate, methods) => {
      var plan = userstate["msg-param-sub-plan"];
      addToTimer(plan == "Prime" ? 1 : plan / 1000);
    }
  );

  client.on("subscription", (channel, username, method, message, userstate) => {
    var plan = userstate["msg-param-sub-plan"];
    addToTimer(plan == "Prime" ? 1 : plan);
  });
}

async function writeTime() {
  settingsJson.seconds = timer;
  await fs.promises.writeFile(
    "./settings.json",
    JSON.stringify(settingsJson, null, 4),
    "UTF-8"
  );
  readSettings();
}

function slConnect() {
  const socket = io.connect(
    `https://sockets.streamlabs.com?token=${settings.socketToken}`,
    {
      reconnect: true,
      transports: ["websocket"],
    }
  );

  socket.on("event", (e) => {
    var message = e.message[0].message;
    if (!message) message = ""; // handles no message on donate

    if (e.type == "donation") {
      timer +=
        settings.currencies[e.message[0].currency] *
        e.message[0].amount *
        settings.dollar;
      sync = 0;
    }
  });
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
}

function main() {
  readSettings();

  setInterval(lowerTimer, 1000);
  writeTime();
  setInterval(writeTime, 10 * 1000);

  initializeAPI();

  eventListener();
  slConnect();

  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ time: timer }));

    setInterval(() => {
      if (sync == 0) {
        console.log("syncing");
        ws.send(JSON.stringify({ time: timer }));
        sync = 1;
      }
    }, 1000);
  });
}

main();
