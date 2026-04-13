const express = require("express");
const router = express.Router();

// Hardcoded admin credentials for initial setup
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Admin@123";

// POST /api/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // In production, generate a real JWT or session token
    return res.json({ token: "admin-token" });
  }
  return res.status(401).json({ message: "Invalid credentials" });
});

// GET /api/auth (example protected route)
router.get("/auth", (req, res) => {
  // Simple token check for demonstration
  const token = req.headers["authorization"] || req.headers["x-access-token"];
  if (token === "admin-token") {
    return res.json({ status: "ok", user: "admin" });
  }
  return res.status(401).json({ message: "Unauthorized" });
});

module.exports = router;
