const dotenv = require("dotenv");

dotenv.config();

function toBool(value, fallback) {
  if (value == null) return fallback;
  return String(value).toLowerCase() === "true";
}

function toList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 4000),
  sql: {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
      encrypt: toBool(process.env.SQL_ENCRYPT, false),
      trustServerCertificate: toBool(process.env.SQL_TRUST_SERVER_CERTIFICATE, true)
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  },
  security: {
    apiKey: process.env.API_KEY,
    apiKeyHeader: process.env.API_KEY_HEADER || "x-api-key",
    allowedOrigins: toList(process.env.ALLOWED_ORIGINS)
  }
};
