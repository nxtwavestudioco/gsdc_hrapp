const express = require("express");
const { getPool, sql } = require("../db");
const { toBuffer, normalizeAttachmentType } = require("../utils/attachments");

const router = express.Router();

// --- TENURE DASHBOARD ENDPOINT ---
router.get("/tenure-dashboard", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`${employeeSelect}`);
    const data = result.recordset.map(row => ({
      ...row,
      tenure: calculateTenure(row.DateHired),
    }));
    // Helper/Driver separation with position filtering
    const groups = {
      driver: { '0-2': [], '3-5': [], '6-10': [], '10+': [] },
      helper: { '0-2': [], '3-5': [], '6-10': [], '10+': [] }
    };
    data.forEach(emp => {
      const years = emp.tenure?.years ?? 0;
      const position = (emp.Position || '').toLowerCase();
      if (position.includes('driver')) {
        let bucket = '0-2';
        if (years >= 3 && years <= 5) bucket = '3-5';
        else if (years >= 6 && years <= 10) bucket = '6-10';
        else if (years > 10) bucket = '10+';
        groups.driver[bucket].push({
          name: emp.FullName,
          dateHired: emp.DateHired,
          bu: emp.BU,
          assignment: emp.Assignment
        });
      } else if (position.includes('helper')) {
        let bucket = '0-2';
        if (years >= 3 && years <= 5) bucket = '3-5';
        else if (years >= 6 && years <= 10) bucket = '6-10';
        else if (years > 10) bucket = '10+';
        groups.helper[bucket].push({
          name: emp.FullName,
          dateHired: emp.DateHired,
          bu: emp.BU,
          assignment: emp.Assignment
        });
      }
    });
    // Return counts and lists
    res.json({
      driver: Object.fromEntries(Object.entries(groups.driver).map(([k, v]) => [k, { count: v.length, list: v }])),
      helper: Object.fromEntries(Object.entries(groups.helper).map(([k, v]) => [k, { count: v.length, list: v }]))
    });
  } catch (err) {
    next(err);
  }
});

// --- LICENSE EXPIRY DASHBOARD ENDPOINT ---
router.get("/license-expiry-dashboard", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`${employeeSelect}`);
    const now = new Date();
    const buckets = {
      '<30': [],
      '<60': [],
      '<90': [],
      '<120+': [],
      'No Expiry': []
    };
    result.recordset.forEach(emp => {
      const position = (emp.Position || '').toLowerCase();
      if (!position.includes('driver')) return; // Only include drivers
      if (!emp.DriversLicenseExpiryDate) {
        buckets['No Expiry'].push({
          name: emp.FullName,
          expiry: '',
          bu: emp.BU,
          assignment: emp.Assignment
        });
        return;
      }
      const exp = new Date(emp.DriversLicenseExpiryDate);
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      let bucket = null;
      if (diffDays < 0) return; // already expired, skip
      if (diffDays < 30) bucket = '<30';
      else if (diffDays < 60) bucket = '<60';
      else if (diffDays < 90) bucket = '<90';
      else bucket = '<120+';
      buckets[bucket].push({
        name: emp.FullName,
        expiry: emp.DriversLicenseExpiryDate,
        bu: emp.BU,
        assignment: emp.Assignment
      });
    });
    res.json(Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, { count: v.length, list: v }])));
  } catch (err) {
    next(err);
  }
});


const employeeSelect = `
  SELECT
    KAMIId,
    FirstName,
    MiddleName,
    LastName,
    FullName,
    Address,
    CivilStatus,
    PlaceOfBirth,
    FatherName,
    MotherName,
    Employer,
    BU,
    Position,
    DrivingExperience,
    PositionStatus,
    Status,
    EmploymentStatus,
    Assignment,
    DriversLicense,
    Restrictioncode,
    DriversLicenseExpiryDate,
    SSSNumber,
    PagibigNumber,
    PhilHealthNumber,
    TINNumber,
    DateHired,
    CreatedAt,
    UpdatedAt
  FROM dbo.EmployeeDetails
`;

async function getAttachmentsMap(pool, fullNames) {
  if (!fullNames.length) return {};
  const request = pool.request();
  const placeholders = fullNames.map((_, idx) => `@fullName${idx}`);
  fullNames.forEach((name, idx) => {
    request.input(`fullName${idx}`, sql.NVarChar(200), name);
  });
  const result = await request.query(`
    SELECT
      Id,
      FullName,
      AttachmentType,
      CreatedAt,
      UpdatedAt
    FROM dbo.Attachments
    WHERE FullName IN (${placeholders.join(",")})
    ORDER BY CreatedAt ASC
  `);
  return result.recordset.reduce((acc, row) => {
    if (!acc[row.FullName]) acc[row.FullName] = [];
    acc[row.FullName].push(row);
    return acc;
  }, {});
}

function mapEmployeeInput(body) {
  return {
    kamiId: body.kamiId,
    firstName: body.firstName || null,
    middleName: body.middleName || null,
    lastName: body.lastName || null,
    fullName: body.fullName,
    address: body.address || null,
    civilStatus: body.civilStatus,
    placeOfBirth: body.placeOfBirth,
    fatherName: body.fatherName,
    motherName: body.motherName,
    employer: body.employer,
    bu: body.bu,
    position: body.position,
    drivingExperience: body.drivingExperience,
    positionStatus: body.positionStatus,
    status: body.status || null,
    employmentStatus: body.employmentStatus,
    assignment: body.assignment,
    driversLicense: body.driversLicense || null,
    restrictioncode: body.restrictioncode || null,
    driversLicenseExpiryDate: body.driversLicenseExpiryDate || null,
    sssNumber: body.sssNumber,
    pagibigNumber: body.pagibigNumber,
    philHealthNumber: body.philHealthNumber,
    tinNumber: body.tinNumber,
  };
}


// Helper to calculate tenure (years, months, days) from DateHired
function calculateTenure(dateHired) {
  if (!dateHired) return null;
  const start = new Date(dateHired);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}

// GET all employees (with optional search)
router.get("/", async (req, res, next) => {
  try {
    const pool = await getPool();
    const request = pool.request();
    if (req.query.search) {
      request.input("search", sql.NVarChar(200), `%${req.query.search}%`);
      const result = await request.query(
        `${employeeSelect}
         WHERE FullName LIKE @search OR CAST(KAMIId AS NVARCHAR(50)) LIKE @search OR BU LIKE @search OR Assignment LIKE @search
         ORDER BY FullName ASC`
      );
      const fullNames = result.recordset.map((row) => row.FullName);
      const attachmentsMap = await getAttachmentsMap(pool, fullNames);
      return res.json(
        result.recordset.map((row) => ({
          ...row,
          tenure: calculateTenure(row.DateHired),
          Attachments: attachmentsMap[row.FullName] || []
        }))
      );
    }
    const result = await request.query(`${employeeSelect} ORDER BY FullName ASC`);
    const fullNames = result.recordset.map((row) => row.FullName);
    const attachmentsMap = await getAttachmentsMap(pool, fullNames);
    res.json(
      result.recordset.map((row) => ({
        ...row,
        tenure: calculateTenure(row.DateHired),
        Attachments: attachmentsMap[row.FullName] || []
      }))
    );
  } catch (err) {
    next(err);
  }
});

// GET single employee by KAMIId
router.get("/:kamiId", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("kamiId", sql.Int, Number(req.params.kamiId))
      .query(`${employeeSelect} WHERE KAMIId = @kamiId`);
    if (!result.recordset.length) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const employee = result.recordset[0];
    const attachmentsMap = await getAttachmentsMap(pool, [employee.FullName]);
    res.json({
      ...employee,
      tenure: calculateTenure(employee.DateHired),
      Attachments: attachmentsMap[employee.FullName] || []
    });
  } catch (err) {
    next(err);
  }
});

// CREATE employee
router.post("/", async (req, res, next) => {
  try {
    const input = mapEmployeeInput(req.body);
    if (!input.kamiId || !input.fullName) {
      return res.status(400).json({ message: "kamiId and fullName are required" });
    }
    const pool = await getPool();
    await pool
      .request()
      .input("kamiId", sql.Int, Number(input.kamiId))
      .input("firstName", sql.NVarChar(100), input.firstName)
      .input("middleName", sql.NVarChar(100), input.middleName)
      .input("lastName", sql.NVarChar(100), input.lastName)
      .input("fullName", sql.NVarChar(200), input.fullName)
      .input("address", sql.NVarChar(300), input.address)
      .input("civilStatus", sql.NVarChar(50), input.civilStatus)
      .input("placeOfBirth", sql.NVarChar(200), input.placeOfBirth)
      .input("fatherName", sql.NVarChar(200), input.fatherName)
      .input("motherName", sql.NVarChar(200), input.motherName)
      .input("employer", sql.NVarChar(200), input.employer)
      .input("bu", sql.NVarChar(100), input.bu)
      .input("position", sql.NVarChar(100), input.position)
      .input("drivingExperience", sql.NVarChar(100), input.drivingExperience || null)
      .input("positionStatus", sql.NVarChar(50), input.positionStatus)
      .input("status", sql.NVarChar(50), input.status)
      .input("employmentStatus", sql.NVarChar(50), input.employmentStatus)
      .input("assignment", sql.NVarChar(150), input.assignment)
      .input("driversLicense", sql.NVarChar(100), input.driversLicense)
      .input("restrictioncode", sql.NVarChar(50), input.restrictioncode)
      .input("driversLicenseExpiryDate", sql.Date, input.driversLicenseExpiryDate)
      .input("sssNumber", sql.NVarChar(50), input.sssNumber)
      .input("pagibigNumber", sql.NVarChar(50), input.pagibigNumber)
      .input("philHealthNumber", sql.NVarChar(50), input.philHealthNumber)
      .input("tinNumber", sql.NVarChar(50), input.tinNumber)
      .query(`
        INSERT INTO dbo.EmployeeDetails (
          KAMIId, FirstName, MiddleName, LastName, FullName, Address, CivilStatus, PlaceOfBirth, FatherName, MotherName,
          Employer, BU, Position, DrivingExperience, PositionStatus, Status, EmploymentStatus,
          Assignment, DriversLicense, Restrictioncode, DriversLicenseExpiryDate, SSSNumber, PagibigNumber, PhilHealthNumber, TINNumber,
          CreatedAt, UpdatedAt
        ) VALUES (
          @kamiId, @firstName, @middleName, @lastName, @fullName, @address, @civilStatus, @placeOfBirth, @fatherName, @motherName,
          @employer, @bu, @position, @drivingExperience, @positionStatus, @status, @employmentStatus,
          @assignment, @driversLicense, @restrictioncode, @driversLicenseExpiryDate, @sssNumber, @pagibigNumber, @philHealthNumber, @tinNumber,
          SYSDATETIME(), SYSDATETIME()
        )
      `);
    res.status(201).json({ message: "Employee created" });
  } catch (err) {
    next(err);
  }
});

// UPDATE employee (PUT)
router.put("/:kamiId", async (req, res, next) => {
  try {
    const input = mapEmployeeInput(req.body);
    if (!input.fullName) {
      return res.status(400).json({ message: "fullName is required" });
    }
    const pool = await getPool();
    const result = await pool
      .request()
      .input("kamiId", sql.Int, Number(req.params.kamiId))
      .input("firstName", sql.NVarChar(100), input.firstName)
      .input("middleName", sql.NVarChar(100), input.middleName)
      .input("lastName", sql.NVarChar(100), input.lastName)
      .input("fullName", sql.NVarChar(200), input.fullName)
      .input("address", sql.NVarChar(300), input.address)
      .input("civilStatus", sql.NVarChar(50), input.civilStatus)
      .input("placeOfBirth", sql.NVarChar(200), input.placeOfBirth)
      .input("fatherName", sql.NVarChar(200), input.fatherName)
      .input("motherName", sql.NVarChar(200), input.motherName)
      .input("employer", sql.NVarChar(200), input.employer)
      .input("bu", sql.NVarChar(100), input.bu)
      .input("position", sql.NVarChar(100), input.position)
      .input("drivingExperience", sql.NVarChar(100), input.drivingExperience || null)
      .input("positionStatus", sql.NVarChar(50), input.positionStatus)
      .input("status", sql.NVarChar(50), input.status)
      .input("employmentStatus", sql.NVarChar(50), input.employmentStatus)
      .input("assignment", sql.NVarChar(150), input.assignment)
      .input("driversLicense", sql.NVarChar(100), input.driversLicense)
      .input("restrictioncode", sql.NVarChar(50), input.restrictioncode)
      .input("driversLicenseExpiryDate", sql.Date, input.driversLicenseExpiryDate)
      .input("sssNumber", sql.NVarChar(50), input.sssNumber)
      .input("pagibigNumber", sql.NVarChar(50), input.pagibigNumber)
      .input("philHealthNumber", sql.NVarChar(50), input.philHealthNumber)
      .input("tinNumber", sql.NVarChar(50), input.tinNumber)
      .query(`
        UPDATE dbo.EmployeeDetails
        SET
          FirstName = @firstName,
          MiddleName = @middleName,
          LastName = @lastName,
          FullName = @fullName,
          Address = @address,
          CivilStatus = @civilStatus,
          PlaceOfBirth = @placeOfBirth,
          FatherName = @fatherName,
          MotherName = @motherName,
          Employer = @employer,
          BU = @bu,
          Position = @position,
          DrivingExperience = @drivingExperience,
          PositionStatus = @positionStatus,
          Status = @status,
          EmploymentStatus = @employmentStatus,
          Assignment = @assignment,
          DriversLicense = @driversLicense,
          Restrictioncode = @restrictioncode,
          DriversLicenseExpiryDate = @driversLicenseExpiryDate,
          SSSNumber = @sssNumber,
          PagibigNumber = @pagibigNumber,
          PhilHealthNumber = @philHealthNumber,
          TINNumber = @tinNumber,
          UpdatedAt = SYSDATETIME()
        WHERE KAMIId = @kamiId;

        SELECT @@ROWCOUNT AS AffectedRows;
      `);
    if (!result.recordset[0].AffectedRows) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ message: "Employee updated" });
  } catch (err) {
    next(err);
  }
});

// --- ATTACHMENT ROUTES ---

// GET all attachments for employee by KAMIId
router.get("/:kamiId/attachments", async (req, res, next) => {
  try {
    const pool = await getPool();
    const employeeResult = await pool
      .request()
      .input("kamiId", sql.Int, Number(req.params.kamiId))
      .query(`SELECT KAMIId, FullName FROM dbo.EmployeeDetails WHERE KAMIId = @kamiId`);
    const employee = employeeResult.recordset[0];
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const result = await pool
      .request()
      .input("fullName", sql.NVarChar(200), employee.FullName)
      .query(`
        SELECT Id, FullName, AttachmentType, CreatedAt, UpdatedAt
        FROM dbo.Attachments
        WHERE FullName = @fullName
        ORDER BY CreatedAt ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

// PUT attachment by KAMIId and type
router.put("/:kamiId/attachments/:type", async (req, res, next) => {
  try {
    const attachmentType = normalizeAttachmentType(req.params.type);
    if (!attachmentType) {
      return res.status(400).json({ message: "Invalid attachment type. Allowed types: Application Form, Certificate of Employment, Medical Diagnostic, NBI Clearance, Police Clearance, Barangay Clearance" });
    }
    const { base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ message: "base64Data is required. Please provide a base64-encoded file." });
    }
    const bytes = toBuffer(base64Data);
    if (!bytes) {
      return res.status(400).json({ message: "Invalid base64Data. Please check your file encoding." });
    }
    const pool = await getPool();
    const employeeResult = await pool
      .request()
      .input("kamiId", sql.Int, Number(req.params.kamiId))
      .query(`SELECT KAMIId, FullName FROM dbo.EmployeeDetails WHERE KAMIId = @kamiId`);
    const employee = employeeResult.recordset[0];
    if (!employee) {
      return res.status(404).json({ message: "Employee not found. Please check the KAMIId." });
    }
    await pool
      .request()
      .input("id", sql.Int, employee.KAMIId)
      .input("fullName", sql.NVarChar(200), employee.FullName)
      .input("attachmentType", sql.NVarChar(100), attachmentType)
      .input("attachmentImage", sql.VarBinary(sql.MAX), bytes)
      .query(`
        MERGE dbo.Attachments AS target
        USING (SELECT @id AS Id, @fullName AS FullName, @attachmentType AS AttachmentType) AS source
        ON target.FullName = source.FullName AND target.AttachmentType = source.AttachmentType
        WHEN MATCHED THEN
          UPDATE SET
            Id = @id,
            AttachmentImage = @attachmentImage,
            UpdatedAt = SYSDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (Id, FullName, AttachmentType, AttachmentImage, CreatedAt, UpdatedAt)
          VALUES (@id, @fullName, @attachmentType, @attachmentImage, SYSDATETIME(), SYSDATETIME());
      `);
    res.json({ message: `${attachmentType} attachment updated` });
  } catch (err) {
    next(err);
  }
});

// GET attachment image by KAMIId and type
router.get("/:kamiId/attachments/:type", async (req, res, next) => {
  try {
    const attachmentType = normalizeAttachmentType(req.params.type);
    if (!attachmentType) {
      return res.status(400).json({ message: "Invalid attachment type. Allowed types: Application Form, Certificate of Employment, Medical Diagnostic, NBI Clearance, Police Clearance, Barangay Clearance" });
    }
    const pool = await getPool();
    const employeeResult = await pool
      .request()
      .input("kamiId", sql.Int, Number(req.params.kamiId))
      .query(`SELECT FullName FROM dbo.EmployeeDetails WHERE KAMIId = @kamiId`);
    const employee = employeeResult.recordset[0];
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const result = await pool
      .request()
      .input("fullName", sql.NVarChar(200), employee.FullName)
      .input("attachmentType", sql.NVarChar(100), attachmentType)
      .query(`
        SELECT AttachmentImage
        FROM dbo.Attachments
        WHERE FullName = @fullName AND AttachmentType = @attachmentType
      `);
    const row = result.recordset[0];
    if (!row || !row.AttachmentImage) {
      // Return 200 with dev-friendly message if no attachment exists
      return res.status(200).json({ message: "No attachment yet" });
    }
    // Allow all file types, serve as application/octet-stream if unknown
    const buffer = row.AttachmentImage;
    // Detect MIME type from file signature (magic number)
    let mimeType = "application/octet-stream";
    if (buffer && buffer.length > 4) {
      const sig = buffer.slice(0, 4).toString('hex').toUpperCase();
      if (sig.startsWith('89504E47')) mimeType = 'image/png';
      else if (sig.startsWith('FFD8FFE0') || sig.startsWith('FFD8FFE1') || sig.startsWith('FFD8FFE2')) mimeType = 'image/jpeg';
      else if (sig.startsWith('25504446')) mimeType = 'application/pdf';
      // Add more types as needed
    }
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", "inline");
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// DELETE attachment by KAMIId and type
router.delete("/:kamiId/attachments/:type", async (req, res, next) => {
  try {
    const attachmentType = normalizeAttachmentType(req.params.type);
    if (!attachmentType) {
      return res.status(400).json({ message: "Invalid attachment type" });
    }
    const pool = await getPool();
    const employeeResult = await pool
      .request()
      .input("kamiId", sql.Int, Number(req.params.kamiId))
      .query(`SELECT FullName FROM dbo.EmployeeDetails WHERE KAMIId = @kamiId`);
    const employee = employeeResult.recordset[0];
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const result = await pool
      .request()
      .input("fullName", sql.NVarChar(200), employee.FullName)
      .input("attachmentType", sql.NVarChar(100), attachmentType)
      .query(`
        DELETE FROM dbo.Attachments
        WHERE FullName = @fullName AND AttachmentType = @attachmentType;
        SELECT @@ROWCOUNT AS AffectedRows;
      `);
    if (!result.recordset[0].AffectedRows) {
      return res.status(404).json({ message: "Attachment not found" });
    }
    res.json({ message: `${attachmentType} attachment deleted` });
  } catch (err) {
    next(err);
  }
});

// --- ATTACHMENT ROUTES BY FULLNAME (for advanced scenarios) ---

router.get("/attachments/by-fullname/:fullName", async (req, res, next) => {
  try {
    const fullName = String(req.params.fullName || "").trim();
    if (!fullName) {
      return res.status(400).json({ message: "fullName is required" });
    }
    const pool = await getPool();
    const result = await pool
      .request()
      .input("fullName", sql.NVarChar(200), fullName)
      .query(`
        SELECT Id, FullName, AttachmentType, CreatedAt, UpdatedAt
        FROM dbo.Attachments
        WHERE FullName = @fullName
        ORDER BY CreatedAt ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

router.put("/attachments/by-fullname/:fullName/:type", async (req, res, next) => {
  try {
    const attachmentType = normalizeAttachmentType(req.params.type);
    if (!attachmentType) {
      return res.status(400).json({ message: "Invalid attachment type" });
    }
    const fullName = String(req.params.fullName || "").trim();
    const { id, base64Data } = req.body;
    if (!fullName || !id || !base64Data) {
      return res.status(400).json({ message: "fullName, id, and base64Data are required" });
    }
    const bytes = toBuffer(base64Data);
    if (!bytes) {
      return res.status(400).json({ message: "Invalid base64Data" });
    }
    const pool = await getPool();
    await pool
      .request()
      .input("id", sql.Int, Number(id))
      .input("fullName", sql.NVarChar(200), fullName)
      .input("attachmentType", sql.NVarChar(100), attachmentType)
      .input("attachmentImage", sql.VarBinary(sql.MAX), bytes)
      .query(`
        MERGE dbo.Attachments AS target
        USING (SELECT @fullName AS FullName, @attachmentType AS AttachmentType) AS source
        ON target.FullName = source.FullName AND target.AttachmentType = source.AttachmentType
        WHEN MATCHED THEN
          UPDATE SET
            Id = @id,
            AttachmentImage = @attachmentImage,
            UpdatedAt = SYSDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (Id, FullName, AttachmentType, AttachmentImage, CreatedAt, UpdatedAt)
          VALUES (@id, @fullName, @attachmentType, @attachmentImage, SYSDATETIME(), SYSDATETIME());
      `);
    res.json({ message: `${attachmentType} attachment updated` });
  } catch (err) {
    next(err);
  }
});

router.get("/attachments/by-fullname/:fullName/:type", async (req, res, next) => {
  try {
    const attachmentType = normalizeAttachmentType(req.params.type);
    if (!attachmentType) {
      return res.status(400).json({ message: "Invalid attachment type" });
    }
    const fullName = String(req.params.fullName || "").trim();
    if (!fullName) {
      return res.status(400).json({ message: "fullName is required" });
    }
    const pool = await getPool();
    const result = await pool
      .request()
      .input("fullName", sql.NVarChar(200), fullName)
      .input("attachmentType", sql.NVarChar(100), attachmentType)
      .query(`
        SELECT AttachmentImage
        FROM dbo.Attachments
        WHERE FullName = @fullName AND AttachmentType = @attachmentType
      `);
    const row = result.recordset[0];
    if (!row || !row.AttachmentImage) {
      return res.status(404).json({ message: "Attachment not found" });
    }
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(row.AttachmentImage);
  } catch (err) {
    next(err);
  }
});

router.delete("/attachments/by-fullname/:fullName/:type", async (req, res, next) => {
  try {
    const attachmentType = normalizeAttachmentType(req.params.type);
    if (!attachmentType) {
      return res.status(400).json({ message: "Invalid attachment type" });
    }
    const fullName = String(req.params.fullName || "").trim();
    if (!fullName) {
      return res.status(400).json({ message: "fullName is required" });
    }
    const pool = await getPool();
    const result = await pool
      .request()
      .input("fullName", sql.NVarChar(200), fullName)
      .input("attachmentType", sql.NVarChar(100), attachmentType)
      .query(`
        DELETE FROM dbo.Attachments
        WHERE FullName = @fullName AND AttachmentType = @attachmentType;
        SELECT @@ROWCOUNT AS AffectedRows;
      `);
    if (!result.recordset[0].AffectedRows) {
      return res.status(404).json({ message: "Attachment not found" });
    }
    res.json({ message: `${attachmentType} attachment deleted` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;