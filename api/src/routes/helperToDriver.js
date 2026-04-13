const express = require("express");
const { getPool, sql } = require("../db");

const router = express.Router();

// GET helpers list from EmployeeDetails for the dropdown
router.get("/helpers-list", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT KAMIId, FullName, Assignment, BU
      FROM dbo.EmployeeDetails
      WHERE LOWER(Position) LIKE '%helper%'
      ORDER BY FullName ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const pool = await getPool();
    const request = pool.request();

    let whereClause = "";
    if (req.query.search) {
      request.input("search", sql.NVarChar(200), `%${req.query.search}%`);
      whereClause = `
        WHERE
          FullName LIKE @search OR
          CAST(KAMIId AS NVARCHAR(50)) LIKE @search OR
          Status LIKE @search OR
          Notes LIKE @search
      `;
    }

    const result = await request.query(`
      SELECT
        KAMIId,
        FullName,
        Status,
        LicenseObtained,
        StartDate,
        CompletionDate,
        CostCenter,
        AreaAssignment,
        Notes,
        CreatedAt,
        UpdatedAt
      FROM dbo.HelperToDriver
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
    const { kamiId, fullName, status, licenseObtained, startDate, completionDate, costCenter, areaAssignment, notes } = req.body;
    if (!kamiId || !fullName) {
      return res.status(400).json({ message: "kamiId and fullName are required" });
    }

    const pool = await getPool();
    await pool
      .request()
      .input("kamiId", sql.Int, Number(kamiId))
      .input("fullName", sql.NVarChar(200), fullName)
      .input("status", sql.NVarChar(50), status || null)
      .input("licenseObtained", sql.Bit, licenseObtained ? 1 : 0)
      .input("startDate", sql.Date, startDate || null)
      .input("completionDate", sql.Date, completionDate || null)
      .input("costCenter", sql.NVarChar(100), costCenter || null)
      .input("areaAssignment", sql.NVarChar(200), areaAssignment || null)
      .input("notes", sql.NVarChar(sql.MAX), notes || null)
      .query(`
        INSERT INTO dbo.HelperToDriver (
          KAMIId, FullName, Status, LicenseObtained, StartDate, CompletionDate, CostCenter, AreaAssignment, Notes, CreatedAt, UpdatedAt
        ) VALUES (
          @kamiId, @fullName, @status, @licenseObtained, @startDate, @completionDate, @costCenter, @areaAssignment, @notes, SYSDATETIME(), SYSDATETIME()
        )
      `);

    res.status(201).json({ message: "Helper-to-Driver record created" });
  } catch (err) {
    next(err);
  }
});

router.put("/:kamiId", async (req, res, next) => {
  try {
    const { fullName, status, licenseObtained, startDate, completionDate, costCenter, areaAssignment, notes } = req.body;
    if (!fullName) {
      return res.status(400).json({ message: "fullName is required" });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input("kamiId", sql.Int, Number(req.params.kamiId))
      .input("fullName", sql.NVarChar(200), fullName)
      .input("status", sql.NVarChar(50), status || null)
      .input("licenseObtained", sql.Bit, licenseObtained ? 1 : 0)
      .input("startDate", sql.Date, startDate || null)
      .input("completionDate", sql.Date, completionDate || null)
      .input("costCenter", sql.NVarChar(100), costCenter || null)
      .input("areaAssignment", sql.NVarChar(200), areaAssignment || null)
      .input("notes", sql.NVarChar(sql.MAX), notes || null)
      .query(`
        UPDATE dbo.HelperToDriver
        SET
          FullName = @fullName,
          Status = @status,
          LicenseObtained = @licenseObtained,
          StartDate = @startDate,
          CompletionDate = @completionDate,
          CostCenter = @costCenter,
          AreaAssignment = @areaAssignment,
          Notes = @notes,
          UpdatedAt = SYSDATETIME()
        WHERE KAMIId = @kamiId;
        SELECT @@ROWCOUNT AS AffectedRows;
      `);

    if (!result.recordset[0].AffectedRows) {
      return res.status(404).json({ message: "Helper-to-Driver record not found" });
    }

    res.json({ message: "Helper-to-Driver record updated" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:kamiId", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("kamiId", sql.Int, Number(req.params.kamiId))
      .query(`
        DELETE FROM dbo.HelperToDriver
        WHERE KAMIId = @kamiId;
        SELECT @@ROWCOUNT AS AffectedRows;
      `);

    if (!result.recordset[0].AffectedRows) {
      return res.status(404).json({ message: "Helper-to-Driver record not found" });
    }

    res.json({ message: "Helper-to-Driver record deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
