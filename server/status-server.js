/**
 * @fileoverview ORIGINAL Status WebSocket server.
 * Periodically fetches from Evos API and broadcasts lobby status to all.
 */

import { WebSocketServer } from "ws";
import client from "prom-client";
import fetch from "node-fetch";
import fs from "fs";
import https from "https";
import http from "http";
import url from "url";
import { v4 as uuidv4 } from "uuid";

const CERT_PATH = "/var/www/vhosts/core-server.be/stats.addalyn.baby/bot/scfsKI35e";
const API_URL = "https://ar.zheneq.net/api/lobby/status";
const DISCORD_WEBHOOK_URL = "https://ptb.discord.com/api/webhooks/1257947988668452874/t95doR1PFNFy5eiKYMjzJ-_ib3MXqm8zKE60LYGAp2i4R9Mnv1wTVMRF9vga3AUdlJED";
const PORT = 7890;
const FETCH_INTERVAL = 1000;
const METRICS_PORT = 7891;

// --- State ---
const connections = {};
const users = {};
let lobbyStatus = {};

// --- Metrics ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const connectedUsersGauge = new client.Gauge({
  name: "launcher_connected_users",
  help: "Number of currently connected users",
});
register.registerMetric(connectedUsersGauge);

const sendToDiscord = async (message) => {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  } catch (err) {
    console.error("Discord webhook error:", err);
  }
};

const handleClose = (uuid) => {
  if (users[uuid]) {
    console.log(`${users[uuid].username} disconnected (Status)`);
    sendToDiscord(`${users[uuid].username} disconnected from Status`);
    delete users[uuid];
  }
  delete connections[uuid];
  connectedUsersGauge.set(Object.keys(connections).length);
};

const broadcast = (message) => {
  const payload = JSON.stringify(message);
  Object.values(connections).forEach((connection) => {
    if (connection.readyState === 1) { // OPEN
      connection.send(payload);
    }
  });
};

const fetchDataAndBroadcast = async () => {
  if (Object.keys(connections).length === 0) return;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      broadcast({ error: "evos server offline" });
      return;
    }

    const data = await response.json();
    lobbyStatus = data;
    broadcast(lobbyStatus);
  } catch (err) {
    broadcast({ error: "evos server offline" });
  }
};

// --- Server Startup ---
let server;
const sslOptions = fs.existsSync(CERT_PATH) ? {
  cert: fs.readFileSync(CERT_PATH),
  key: fs.readFileSync(CERT_PATH),
} : null;

if (sslOptions) {
  server = https.createServer(sslOptions);
  console.log("Status Server: Starting HTTPS...");
} else {
  server = http.createServer();
  console.log("Status Server: Starting HTTP...");
}

const wsServer = new WebSocketServer({ server });

wsServer.on("connection", async (connection, request) => {
  const { username } = url.parse(request.url, true).query;
  if (!username) {
    connection.close();
    return;
  }

  console.log(`${username} connected to Status`);
  const uuid = uuidv4();
  connections[uuid] = connection;
  users[uuid] = { username, state: {} };
  sendToDiscord(`${username} connected to Status`);
  connectedUsersGauge.set(Object.keys(connections).length);
  
  await fetchDataAndBroadcast();

  connection.on("close", () => handleClose(uuid));
});

server.listen(PORT, () => {
  console.log(`Status WebSocket server is running on port ${PORT}`);
});

setInterval(fetchDataAndBroadcast, FETCH_INTERVAL);

// --- Metrics Server ---
let metricsServer;
const metricsHandler = async (req, res) => {
  if (req.url === "/metrics") {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
  } else {
    res.writeHead(404);
    res.end();
  }
};

if (sslOptions) {
  metricsServer = https.createServer(sslOptions, metricsHandler);
} else {
  metricsServer = http.createServer(metricsHandler);
}

metricsServer.listen(METRICS_PORT, () => {
  console.log(`Status Metrics server is running on port ${METRICS_PORT}`);
});
