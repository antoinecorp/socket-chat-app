const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.secretToken,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/login");
  }
}

// Hardcoded user for demonstration
const users = {
  admin: bcrypt.hashSync(process.env.password, 10),
};

// Login endpoint (GET)
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "", "login.html"));
});

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const userPasswordHash = users[username];
  if (userPasswordHash && bcrypt.compareSync(password, userPasswordHash)) {
    req.session.user = username;
    res.redirect("/dashboard");
  } else {
    res.status(401).send("Invalid username or password");
  }
});

// Dashboard endpoint (GET)
app.get("/dashboard", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "", "dashboard.html"));
});

let clients = new Map();

wss.on("connection", (ws, req) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    clients.set(ws, data);
    broadcastClients();
  });

  ws.on("close", () => {
    clients.delete(ws);
    broadcastClients();
  });
});

function broadcastClients() {
  const clientsData = Array.from(clients.values());
  const data = JSON.stringify(clientsData);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Broadcast message to clients periodically
setInterval(() => {
  broadcastClients();
}, 5000); // 10 seconds interval

// Endpoint to send a command or custom JS script to all clients
app.post("/send-command", isAuthenticated, (req, res) => {
  const command = req.body.command;
  const script = req.body.script;
  if (command) {
    broadcastCommand(command);
  }
  if (script) {
    broadcastScript(script);
  }
  res.send({ success: true });
});

function broadcastCommand(command) {
  const data = JSON.stringify({ type: "command", command });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastScript(script) {
  const data = JSON.stringify({ type: "script", script });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
