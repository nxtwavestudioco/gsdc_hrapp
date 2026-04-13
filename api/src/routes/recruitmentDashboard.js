const express = require("express");
const { getPool, sql } = require("../db");

const router = express.Router();

// GET /api/recruitment-dashboard
// Returns recruitment counts by period (day/week/month/year) per position, and counts per status
router.get("/", async (req, res, next) => {
  try {
    const pool = await getPool();

    // Daily counts (last 30 days) per position
    const dailyResult = await pool.request().query(`
      SELECT
        CONVERT(VARCHAR(10), RecruitmentDate, 120) AS Period,
        ISNULL(Position, 'Unspecified') AS Position,
        COUNT(*) AS Total
      FROM dbo.Recruitment
      WHERE RecruitmentDate >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
      GROUP BY CONVERT(VARCHAR(10), RecruitmentDate, 120), Position
      ORDER BY Period DESC
    `);

    // Weekly counts (last 12 weeks) per position
    const weeklyResult = await pool.request().query(`
      SELECT
        CONCAT(YEAR(RecruitmentDate), '-W', RIGHT('0' + CAST(DATEPART(ISO_WEEK, RecruitmentDate) AS VARCHAR), 2)) AS Period,
        ISNULL(Position, 'Unspecified') AS Position,
        COUNT(*) AS Total
      FROM dbo.Recruitment
      WHERE RecruitmentDate >= DATEADD(WEEK, -12, CAST(GETDATE() AS DATE))
      GROUP BY YEAR(RecruitmentDate), DATEPART(ISO_WEEK, RecruitmentDate), Position
      ORDER BY Period DESC
    `);

    // Monthly counts (last 12 months) per position
    const monthlyResult = await pool.request().query(`
      SELECT
        FORMAT(RecruitmentDate, 'yyyy-MM') AS Period,
        ISNULL(Position, 'Unspecified') AS Position,
        COUNT(*) AS Total
      FROM dbo.Recruitment
      WHERE RecruitmentDate >= DATEADD(MONTH, -12, CAST(GETDATE() AS DATE))
      GROUP BY FORMAT(RecruitmentDate, 'yyyy-MM'), Position
      ORDER BY Period DESC
    `);

    // Yearly counts per position
    const yearlyResult = await pool.request().query(`
      SELECT
        CAST(YEAR(RecruitmentDate) AS VARCHAR) AS Period,
        ISNULL(Position, 'Unspecified') AS Position,
        COUNT(*) AS Total
      FROM dbo.Recruitment
      WHERE RecruitmentDate IS NOT NULL
      GROUP BY YEAR(RecruitmentDate), Position
      ORDER BY Period DESC
    `);

    // Status counts
    const statusResult = await pool.request().query(`
      SELECT
        ISNULL(Status, 'Unknown') AS Status,
        COUNT(*) AS Total
      FROM dbo.Recruitment
      GROUP BY Status
      ORDER BY Total DESC
    `);

    res.json({
      daily: dailyResult.recordset,
      weekly: weeklyResult.recordset,
      monthly: monthlyResult.recordset,
      yearly: yearlyResult.recordset,
      byStatus: statusResult.recordset,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
