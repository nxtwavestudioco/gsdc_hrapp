const dotenv = require("dotenv");
dotenv.config();
console.log("API_KEY from env:", process.env.API_KEY);

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const config = require("./config");
const { getPool } = require("./db");

const employeesRoute = require("./routes/employees");
const recruitmentRoute = require("./routes/recruitment");
const helperRoute = require("./routes/helperToDriver");
const dashboardRoute = require("./routes/dashboard");
const authRoute = require("./routes/auth");
const usersRoute = require("./routes/users");
const recruitmentAttachmentsRoute = require("./routes/recruitmentAttachments");
const recruitmentDashboardRoute = require("./routes/recruitmentDashboard");

const app = express();

if (!config.security.apiKey) {
  throw new Error("API_KEY is not configured. Set API_KEY in environment variables before starting the API.");
}

const corsOptions = {
  origin: true
};

// Expand CORS options to explicitly allow the API key header and common methods
corsOptions.methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
corsOptions.allowedHeaders = [config.security.apiKeyHeader || "x-api-key", "Content-Type", "Authorization"];
corsOptions.optionsSuccessStatus = 204;

function isValidApiKey(providedKey) {
  if (!providedKey) return false;

  const expected = Buffer.from(String(config.security.apiKey));
  const actual = Buffer.from(String(providedKey));
  if (expected.length !== actual.length) return false;

  return crypto.timingSafeEqual(expected, actual);
}

function requireApiKey(req, res, next) {
  if (req.path === "/api/healthz") {
    return next();
  }

  // Allow CORS preflight requests to pass through without API key
  if (req.method === 'OPTIONS') {
    return next();
  }

  const headerName = config.security.apiKeyHeader;
  const providedKey = req.get(headerName);

  if (!isValidApiKey(providedKey)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
}

// Respond to preflight requests before API key middleware runs
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(requireApiKey);

app.get("/api/healthz", (req, res) => {
  res.json({ status: "ok", service: "hr-api" });
});

app.get("/api/health", async (req, res) => {
  try {
    await getPool();
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected", message: err.message });
  }
});

app.use("/api/employees", employeesRoute);
app.use("/api/recruitment", recruitmentRoute);
app.use("/api/helper-to-driver", helperRoute);
app.use("/api/recruitment-attachments", recruitmentAttachmentsRoute);
app.use("/api/recruitment-dashboard", recruitmentDashboardRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/users", usersRoute);
app.use("/api", authRoute);

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error", detail: err.message });
});

app.listen(config.port, config.host, () => {
  console.log(`HR API running on ${config.host}:${config.port}`);
});
