/**
 * @fileoverview DEDICATED Chat WebSocket server.
 * Handles only community chat messaging, history, and online counts.
 */

import { WebSocketServer, WebSocket } from "ws";
import client from "prom-client";
import fetch from "node-fetch";
import fs from "fs";
import https from "https";
import http from "http";
import url from "url";
import { v4 as uuidv4 } from "uuid";

// --- Configuration ---
const PORT = 7900; // New dedicated port for chat
const METRICS_PORT = 7901;
const DISCORD_WEBHOOK_URL = "https://ptb.discord.com/api/webhooks/1257947988668452874/t95doR1PFNFy5eiKYMjzJ-_ib3MXqm8zKE60LYGAp2i4R9Mnv1wTVMRF9vga3AUdlJED";
const CERT_PATH = "/var/www/vhosts/core-server.be/stats.addalyn.baby/bot/scfsKI35e";
const HISTORY_LIMIT = 100;

// --- State ---
const connections = new Map(); // uuid -> connection
const users = new Map();       // uuid -> { username, handle }
const chatHistory = [];        // Optional: Can still keep global or separate per pair (keeping global for now, but filtering manually)

// --- Metrics ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const chatUsersGauge = new client.Gauge({
  name: "chat_connected_users",
  help: "Number of users currently in chat",
});
register.registerMetric(chatUsersGauge);

// --- Helpers ---
const sendToDiscord = async (message) => {
  try {
    if (!DISCORD_WEBHOOK_URL) return;
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  } catch (err) {
    console.error("Discord webhook error (Chat):", err);
  }
};

/** Broadcast to all connected clients */
const broadcast = (message) => {
  const payload = JSON.stringify(message);
  for (const connection of connections.values()) {
    if (connection.readyState === 1) { // OPEN
      connection.send(payload);
    }
  }
};

/** Send updated online user list to everyone */
const broadcastUserList = () => {
  const onlineUsers = Array.from(users.values()).map(u => u.handle);
  broadcast({ type: 'USER_LIST', users: onlineUsers });
};

const handleClose = (uuid) => {
  const user = users.get(uuid);
  if (user) {
    console.log(`${user.username} left Chat`);
    sendToDiscord(`User ${user.username} left Chat`);
    users.delete(uuid);
  }
  connections.delete(uuid);
  chatUsersGauge.set(connections.size);
  broadcastUserList();
};

// --- Server Setup ---
let server;
const sslOptions = fs.existsSync(CERT_PATH) ? {
  cert: fs.readFileSync(CERT_PATH),
  key: fs.readFileSync(CERT_PATH),
} : null;

if (sslOptions) {
  server = https.createServer(sslOptions);
  console.log("Chat Server: Starting HTTPS...");
} else {
  server = http.createServer();
  console.log("Chat Server: Starting HTTP...");
}

const wsServer = new WebSocketServer({ server });

wsServer.on("connection", async (connection, request) => {
  const parsedUrl = url.parse(request.url, true);
  const query = parsedUrl.query;
  const pathname = parsedUrl.pathname;
  
  console.log(`Chat Connection attempt: ${pathname} with query:`, query);
  
  const username = query.username || query.handle;
  
  if (!username) {
    connection.close();
    return;
  }

  const uuid = uuidv4();
  connections.set(uuid, connection);
  users.set(uuid, { username, handle: decodeURIComponent(username) });
  
  console.log(`User ${username} joined Chat`);
  sendToDiscord(`User ${username} joined Chat`);
  chatUsersGauge.set(connections.size);

  connection.on("message", (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage);
      
      if (data.type === 'INIT') {
        // connection.send(JSON.stringify({ type: 'HISTORY', messages: chatHistory })); // History is complex for private chat, skipping for now
        broadcastUserList();
        return;
      }
      
      if (data.type === 'CHAT') {
        const fromHandle = decodeURIComponent(data.from || username);
        const toHandle = data.to; // The recipient handle
        
        const chatMsg = {
          type: 'CHAT',
          id: uuidv4(),
          from: fromHandle,
          to: toHandle,
          text: data.text,
          timestamp: Date.now()
        };

        // Find recipient connection(s)
        let sent = false;
        for (const [id, conn] of connections.entries()) {
          const user = users.get(id);
          if (user && (user.handle === toHandle || user.handle === fromHandle)) {
            if (conn.readyState === 1) {
              conn.send(JSON.stringify(chatMsg));
              sent = true;
            }
          }
        }
      }
      
      if (data.type === 'DISCONNECT') {
        handleClose(uuid);
      }
    } catch (err) {
      console.error("Chat parsing error:", err);
    }
  });

  connection.on("close", () => handleClose(uuid));

  // Initial data
  broadcastUserList();
});

server.listen(PORT, () => {
  console.log(`Chat WebSocket server is running on port ${PORT}`);
});

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
  console.log(`Chat Metrics server is running on port ${METRICS_PORT}`);
});
