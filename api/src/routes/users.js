const express = require("express");
const { getPool, sql } = require("../db");

const router = express.Router();

// List users (excluding password)
router.get("/", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT Id, Username, FullName, Email, Role, Phone, Department, CreatedAt, UpdatedAt
      FROM dbo.HRAppUsers
      ORDER BY Username ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

// Get user by id
router.get("/:id", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, Number(req.params.id))
      .query(`
        SELECT Id, Username, FullName, Email, Role, Phone, Department, CreatedAt, UpdatedAt
        FROM dbo.HRAppUsers
        WHERE Id = @id
      `);

    if (!result.recordset.length) return res.status(404).json({ message: "User not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

// Get user by username
router.get("/by-username/:username", async (req, res, next) => {
  try {
    const username = String(req.params.username || "").trim();
    if (!username) return res.status(400).json({ message: "username is required" });

    const pool = await getPool();
    const result = await pool
      .request()
      .input("username", sql.NVarChar(100), username)
      .query(`
        SELECT Id, Username, FullName, Email, Role, Phone, Department, CreatedAt, UpdatedAt
        FROM dbo.HRAppUsers
        WHERE Username = @username
      `);

    if (!result.recordset.length) return res.status(404).json({ message: "User not found" });
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

// Create user
router.post("/", async (req, res, next) => {
  try {
    const { username, password, fullName, email, role, phone, department } = req.body;
    if (!username || !password) return res.status(400).json({ message: "username and password are required" });

    const pool = await getPool();
    await pool
      .request()
      .input("username", sql.NVarChar(100), username)
      .input("password", sql.NVarChar(200), password)
      .input("fullName", sql.NVarChar(200), fullName || null)
      .input("email", sql.NVarChar(200), email || null)
      .input("role", sql.NVarChar(50), role || null)
      .input("phone", sql.NVarChar(50), phone || null)
      .input("department", sql.NVarChar(100), department || null)
      .query(`
        INSERT INTO dbo.HRAppUsers (Username, Password, FullName, Email, Role, Phone, Department, CreatedAt, UpdatedAt)
        VALUES (@username, @password, @fullName, @email, @role, @phone, @department, SYSDATETIME(), SYSDATETIME());
      `);

    res.status(201).json({ message: "User created" });
  } catch (err) {
    // handle unique constraint
    if (err && err.number === 2627) return res.status(409).json({ message: "Username already exists" });
    next(err);
  }
});

// Update user (including optional password change)
router.put("/:id", async (req, res, next) => {
  try {
    const { fullName, email, role, phone, department, password } = req.body;
    const pool = await getPool();
    const request = pool.request().input("id", sql.Int, Number(req.params.id));

    if (password) request.input("password", sql.NVarChar(200), password);
    request.input("fullName", sql.NVarChar(200), fullName || null);
    request.input("email", sql.NVarChar(200), email || null);
    request.input("role", sql.NVarChar(50), role || null);
    request.input("phone", sql.NVarChar(50), phone || null);
    request.input("department", sql.NVarChar(100), department || null);

    const setClauseParts = [
      "FullName = @fullName",
      "Email = @email",
      "Role = @role",
      "Phone = @phone",
      "Department = @department",
      "UpdatedAt = SYSDATETIME()"
    ];
    if (password) setClauseParts.unshift("Password = @password");

    const result = await request.query(`
      UPDATE dbo.HRAppUsers
      SET ${setClauseParts.join(",\n      ")}
      WHERE Id = @id;
      SELECT @@ROWCOUNT AS AffectedRows;
    `);

    if (!result.recordset[0].AffectedRows) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated" });
  } catch (err) {
    next(err);
  }
});

// Delete user
router.delete("/:id", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, Number(req.params.id))
      .query(`
        DELETE FROM dbo.HRAppUsers
        WHERE Id = @id;
        SELECT @@ROWCOUNT AS AffectedRows;
      `);

    if (!result.recordset[0].AffectedRows) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
