const tmi = require("tmi.js");
const fs = require("fs");
const WebSocket = require("ws");
const io = require("socket.io-client");
const axios = require("axios");
const database = require("./db");
const url = require("url");

const port = 3001;
const portWss = 3003;
const wss = new WebSocket.Server({ port: portWss });
const client_id = "3qy8w6q7u5u7wamjmggmykmrv3wjj9";

const defaultValues = {
  sub: 60,
  dollar: 15,
  pushFrequency: 5,
};

var settings,
  timer = 0,
  readableTime = "0:00:00",
  settings,
  sync = false,
  timeout = 5,
  forceSync = 30;

function addToTimer(ws, seconds) {
  amount = parseInt(seconds) || 0;
  ws.timer += amount;
  syncTimer(ws);
}

function startTMI(ws) {
  console.log("connecting to", ws.name);
  const client = new tmi.Client({
    connection: {
      reconnect: true,
    },
    channels: [ws.name],
  });

  client.connect();

  client.on(
    "subgift",
    (channel, username, streakMonths, recipient, methods, userstate) => {
      var plan = userstate["msg-param-sub-plan"];
      var tier = plan == "Prime" ? 1 : plan / 1000;
      var amount = tier * ws.sub;
      console.log(`adding ${amount} to ${ws.name}`);
      addToTimer(ws, amount);
    }
  );

  client.on("anongiftpaidupgrade", (channel, username, userstate) => {
    var plan = userstate["msg-param-sub-plan"];
    var tier = plan == "Prime" ? 1 : plan / 1000;
    var amount = tier * ws.sub;
    console.log(`adding ${amount} to ${ws.name}`);
    addToTimer(ws, amount);
  });

  client.on("cheer", (channel, userstate, message) => {
    addToTimer(ws, (userstate["bits"] / 100) * ws.dollar);
  });

  client.on(
    "resub",
    (channel, username, months, message, userstate, methods) => {
      var plan = userstate["msg-param-sub-plan"];
      var tier = plan == "Prime" ? 1 : plan / 1000;
      var amount = tier * ws.sub;
      console.log(`adding ${amount} to ${ws.name}`);
      addToTimer(ws, amount);
    }
  );

  client.on("subscription", (channel, username, method, message, userstate) => {
    var plan = userstate["msg-param-sub-plan"];
    var tier = plan == "Prime" ? 1 : plan / 1000;
    var amount = tier * ws.sub;
    console.log(`adding ${amount} to ${ws.name}`);
    addToTimer(ws, amount);
  });
}

function connectStreamlabs(ws) {
  if (ws.socket) ws.socket.disconnect();

  ws.socket = io.connect(`https://sockets.streamlabs.com?token=${ws.slToken}`, {
    reconnect: true,
    transports: ["websocket"],
  });

  ws.socket.on("connect", () => {
    ws.slStatus = true;
    syncTimer(ws);
  });

  ws.socket.on("disconnect", () => {
    ws.slStatus = false;
  });

  ws.socket.on("event", (e) => {
    if (e.type == "donation") {
      var amount = 1 * e.message[0].amount * ws.dollar;
      console.log(`adding ${amount} to ${ws.name}`);
      addToTimer(ws, amount);
    }
  });
}

function lowerTimer(ws) {
  if (ws.timer > 0) {
    ws.timer -= 1;
    ws.readableTime =
      Math.floor(timer / 3600) +
      ":" +
      ("0" + (Math.floor(timer / 60) % 60)).slice(-2) +
      ":" +
      ("0" + (timer % 60)).slice(-2);
  }
}

async function syncTimer(ws) {
  if (!Number.isInteger(ws.timer)) ws.timer = 0;
  if (!ws.slStatus) ws.sl;
  ws.send(
    JSON.stringify({
      time: parseInt(ws.timer),
      sub: ws.sub,
      dollar: ws.dollar,
      slStatus: ws.slStatus,
    })
  );
  pushToDb(ws);
}

async function login(ws, accessToken) {
  ws.slStatus = false;
  axios
    .get(`https://api.twitch.tv/helix/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": client_id,
      },
    })
    .then((httpRes) => {
      ws.userId = httpRes.data.data[0].id;
      ws.name = httpRes.data.data[0].login;

      database.Users.findByPk(ws.userId).then((res) => {
        if (!res) {
          newUser = {
            userId: ws.userId,
            name: ws.name,
            accessToken: accessToken,
            sub: defaultValues.sub,
            dollar: defaultValues.dollar,
            timer: 0,
          };
          Object.assign(ws, newUser);
          database.createUser(newUser);
          ws.initialized = true;
          startTMI(ws);
        } else {
          Object.assign(ws, res.dataValues);
          if (ws.slToken) connectStreamlabs(ws);
          else syncTimer(ws);

          startTMI(ws);
        }
      });
    })
    .catch(function (error) {
      sendError(ws, "failed to login" + error);
      return 0;
    });
}

async function pushToDb(ws) {
  if (ws.userId)
    database.Users.update(
      {
        name: ws.name,
        accessToken: ws.accessToken,
        sub: ws.sub,
        dollar: ws.dollar,
        slToken: ws.slToken,
        timer: ws.timer,
      },
      {
        where: {
          userId: ws.userId,
        },
      }
    );
}

async function sendError(ws, message) {
  ws.send(
    JSON.stringify({
      error: message,
    })
  );
}

async function validateUser(ws, data) {
  axios
    .get(`https://api.twitch.tv/helix/users`, {
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
        "Client-Id": client_id,
      },
    })
    .then((httpRes) => {
      if (httpRes.data.data[0].id == ws.userId) return true;
      sendError(ws, "invalid token");
      return false;
    })
    .catch(function (error) {
      sendError(ws, "invalid token");
      return false;
    });
}

function main() {
  wss.on("connection", (ws, req) => {
    if (url.parse(req.url, true).query.token) {
      try {
        login(ws, url.parse(req.url, true).query.token);
      } catch (error) {
        sendError(ws, "invalid token.");
        return 0;
      }
    }

    setInterval(() => {
      lowerTimer(ws);
    }, 1000);

    ws.onmessage = function (event) {
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        sendError(ws, "json error");
        return 0;
      }

      switch (data.event) {
        case "getTime":
          syncTimer(ws);
          break;
        case "connectStreamlabs":
          ws.slToken = data.slToken;
          pushToDb(ws);
          connectStreamlabs(ws);
          break;
        case "setSetting":
          ws[data.setting] = data.value;
          pushToDb(ws);
          break;
        case "setTime":
          ws.timer = data.value;
          pushToDb(ws);
          break;
      }
    };
  });
}

main();
