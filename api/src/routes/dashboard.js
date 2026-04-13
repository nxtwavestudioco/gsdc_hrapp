const express = require("express");
const { getPool } = require("../db");

const router = express.Router();

router.get("/summary", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        ISNULL(BU, 'Unassigned') AS BU,
        CASE
          WHEN LOWER(Position) LIKE '%driver%' THEN 'DRIVER'
          WHEN LOWER(Position) LIKE '%helper%' THEN 'HELPER'
          ELSE 'OTHERS'
        END AS PositionGroup,
        COUNT(*) AS TotalCount,
        SUM(CASE WHEN PositionStatus LIKE '%Deployed%' THEN 1 ELSE 0 END) AS DeployedCount,
        SUM(CASE WHEN PositionStatus LIKE '%Apprentice%' THEN 1 ELSE 0 END) AS ApprenticeCount,
        SUM(CASE WHEN (PositionStatus NOT LIKE '%Deployed%' AND PositionStatus NOT LIKE '%Apprentice%') OR PositionStatus IS NULL THEN 1 ELSE 0 END) AS UndeployedCount,
        SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) AS ActiveCount,
        SUM(CASE WHEN Status = 'On Leave' THEN 1 ELSE 0 END) AS OnLeaveCount,
        SUM(CASE WHEN Status = 'Inactive' THEN 1 ELSE 0 END) AS InactiveCount
      FROM dbo.EmployeeDetails
      GROUP BY BU,
        CASE
          WHEN LOWER(Position) LIKE '%driver%' THEN 'DRIVER'
          WHEN LOWER(Position) LIKE '%helper%' THEN 'HELPER'
          ELSE 'OTHERS'
        END
      ORDER BY BU, PositionGroup;
    `);

    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
