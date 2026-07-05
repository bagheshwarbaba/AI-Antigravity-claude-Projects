const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
const vaultsDir = path.join(dataDir, "vaults");
const usersPath = path.join(dataDir, "users.json");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(vaultsDir)) fs.mkdirSync(vaultsDir);

if (!fs.existsSync(usersPath)) {
  fs.writeFileSync(usersPath, JSON.stringify({ users: [] }, null, 2));
}

// DB helpers
const readUsers = () => JSON.parse(fs.readFileSync(usersPath, "utf-8"));
const writeUsers = (data) => fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));

const getVaultPath = (userId) => path.join(vaultsDir, `vault_${userId}.json`);

const readVault = (userId) => {
  const p = getVaultPath(userId);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify({ payments: [], history: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(p, "utf-8"));
};

const writeVault = (userId, data) => {
  fs.writeFileSync(getVaultPath(userId), JSON.stringify(data, null, 2));
};

app.locals.readUsers = readUsers;
app.locals.writeUsers = writeUsers;
app.locals.readVault = readVault;
app.locals.writeVault = writeVault;

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/history", require("./routes/history"));

// Health check
app.get("/api/health", (req, res) => res.json({ status: "OK", timestamp: new Date() }));

app.listen(PORT, () => {
  console.log(`🚀 E-Payment Backend running on http://localhost:${PORT}`);
});
