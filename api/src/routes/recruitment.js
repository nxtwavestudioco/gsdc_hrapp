const express = require("express");
const { getPool, sql } = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    let whereClause = "";
    if (req.query.search) {
      request.input("search", sql.NVarChar(200), `%${req.query.search}%`);
      whereClause = `
        WHERE
          FirstName LIKE @search OR
          MiddleName LIKE @search OR
          LastName LIKE @search OR
          Phone LIKE @search OR
          Email LIKE @search OR
          Status LIKE @search OR
          Notes LIKE @search
      `;
    }

    const result = await request.query(`
      SELECT
        RecruitmentId,
        RecruitmentDate,
        FirstName,
        MiddleName,
        LastName,
        Phone,
        Email,
        Status,
        Notes,
        CreatedAt,
        UpdatedAt
      FROM dbo.Recruitment
      ${whereClause}
      ORDER BY UpdatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { recruitmentId, recruitmentDate, firstName, middleName, lastName, phone, email, position, status, notes } = req.body;
    if (!recruitmentId || !firstName || !lastName) {
      return res.status(400).json({ message: "recruitmentId, firstName and lastName are required" });
    }
    const fullName = `${lastName}, ${firstName}${middleName ? ' ' + middleName : ''}`;
    const pool = await getPool();
    await pool
      .request()
      .input("recruitmentId", sql.NVarChar(30), recruitmentId)
      .input("recruitmentDate", sql.Date, recruitmentDate || null)
      .input("firstName", sql.NVarChar(100), firstName)
      .input("middleName", sql.NVarChar(100), middleName || null)
      .input("lastName", sql.NVarChar(100), lastName)
      .input("fullName", sql.NVarChar(300), fullName)
      .input("phone", sql.NVarChar(50), phone || null)
      .input("email", sql.NVarChar(200), email || null)
      .input("position", sql.NVarChar(50), position || null)
      .input("status", sql.NVarChar(50), status || null)
      .input("notes", sql.NVarChar(sql.MAX), notes || null)
      .query(`
        INSERT INTO dbo.Recruitment (
          RecruitmentId, RecruitmentDate, FirstName, MiddleName, LastName, FullName, Phone, Email, Position, Status, Notes, CreatedAt, UpdatedAt
        ) VALUES (
          @recruitmentId, @recruitmentDate, @firstName, @middleName, @lastName, @fullName, @phone, @email, @position, @status, @notes, SYSDATETIME(), SYSDATETIME()
        )
      `);
    res.status(201).json({ message: "Recruitment record created", recruitmentId });
  } catch (err) {
    next(err);
  }
});

router.put("/:recruitmentId", async (req, res, next) => {
  try {
    const { recruitmentDate, firstName, middleName, lastName, phone, email, position, status, notes } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "firstName and lastName are required" });
    }
    const fullName = `${lastName}, ${firstName}${middleName ? ' ' + middleName : ''}`;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("recruitmentId", sql.NVarChar(30), req.params.recruitmentId)
      .input("recruitmentDate", sql.Date, recruitmentDate || null)
      .input("firstName", sql.NVarChar(100), firstName)
      .input("middleName", sql.NVarChar(100), middleName || null)
      .input("lastName", sql.NVarChar(100), lastName)
      .input("fullName", sql.NVarChar(300), fullName)
      .input("phone", sql.NVarChar(50), phone || null)
      .input("email", sql.NVarChar(200), email || null)
      .input("position", sql.NVarChar(50), position || null)
      .input("status", sql.NVarChar(50), status || null)
      .input("notes", sql.NVarChar(sql.MAX), notes || null)
      .query(`
        UPDATE dbo.Recruitment
        SET
          RecruitmentDate = @recruitmentDate,
          FirstName = @firstName,
          MiddleName = @middleName,
          LastName = @lastName,
          FullName = @fullName,
          Phone = @phone,
          Email = @email,
          Position = @position,
          Status = @status,
          Notes = @notes,
          UpdatedAt = SYSDATETIME()
        WHERE RecruitmentId = @recruitmentId;
        SELECT @@ROWCOUNT AS AffectedRows;
      `);
    if (!result.recordset[0].AffectedRows) {
      return res.status(404).json({ message: "Recruitment record not found" });
    }
    res.json({ message: "Recruitment record updated" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:recruitmentId", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("recruitmentId", sql.NVarChar(30), req.params.recruitmentId)
      .query(`
        DELETE FROM dbo.Recruitment
        WHERE RecruitmentId = @recruitmentId;
        SELECT @@ROWCOUNT AS AffectedRows;
      `);

    if (!result.recordset[0].AffectedRows) {
      return res.status(404).json({ message: "Recruitment record not found" });
    }

    res.json({ message: "Recruitment record deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
