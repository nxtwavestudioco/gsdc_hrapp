const express = require("express");
const { getPool, sql } = require("../db");
const router = express.Router();

function detectMimeType(buffer) {
  if (!buffer || buffer.length < 4) return "application/octet-stream";

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PDF: 25 50 44 46
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }

  // ZIP-based (docx, xlsx, pptx): 50 4B 03 04
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  // DOC (old Office): D0 CF 11 E0
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) {
    return "application/msword";
  }

  return "application/octet-stream";
}

// GET all attachments for a recruitment
router.get("/:recruitmentId", async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("recruitmentId", sql.NVarChar(30), req.params.recruitmentId)
      .query(`
        SELECT RecruitmentId, AttachmentType, AttachmentImage, CreatedAt, UpdatedAt
        FROM dbo.RecruitmentAttachments
        WHERE RecruitmentId = @recruitmentId
        ORDER BY CreatedAt DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

// GET a specific attachment as a file (for preview)
router.get("/:recruitmentId/file", async (req, res, next) => {
  try {
    const { type } = req.query;
    const pool = await getPool();
    const result = await pool.request()
      .input("recruitmentId", sql.NVarChar(30), req.params.recruitmentId)
      .input("attachmentType", sql.NVarChar(50), type || "resume")
      .query(`
        SELECT AttachmentImage
        FROM dbo.RecruitmentAttachments
        WHERE RecruitmentId = @recruitmentId AND AttachmentType = @attachmentType
      `);

    if (!result.recordset[0] || !result.recordset[0].AttachmentImage) {
      return res.status(404).send("Attachment not found");
    }

    const fileBuffer = result.recordset[0].AttachmentImage;
    res.setHeader("Content-Type", detectMimeType(fileBuffer));
    res.setHeader("Content-Disposition", "inline");
    res.send(fileBuffer);
  } catch (err) {
    next(err);
  }
});

// POST a new attachment for a recruitment
router.post("/", async (req, res, next) => {
  try {
    const { recruitmentId, attachmentType, attachmentImage } = req.body;
    if (!recruitmentId || !attachmentType || !attachmentImage) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const pool = await getPool();
    await pool.request()
      .input("recruitmentId", sql.NVarChar(30), recruitmentId)
      .input("attachmentType", sql.NVarChar(50), attachmentType)
      .input("attachmentImage", sql.VarBinary(sql.MAX), Buffer.from(attachmentImage, 'base64'))
      .query(`
        MERGE dbo.RecruitmentAttachments AS target
        USING (SELECT @recruitmentId AS RecruitmentId, @attachmentType AS AttachmentType) AS source
        ON target.RecruitmentId = source.RecruitmentId AND target.AttachmentType = source.AttachmentType
        WHEN MATCHED THEN
          UPDATE SET AttachmentImage = @attachmentImage, UpdatedAt = SYSDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (RecruitmentId, AttachmentType, AttachmentImage, CreatedAt, UpdatedAt)
          VALUES (@recruitmentId, @attachmentType, @attachmentImage, SYSDATETIME(), SYSDATETIME());
      `);
    res.status(201).json({ message: "Attachment uploaded" });
  } catch (err) {
    next(err);
  }
});

// DELETE a specific attachment for a recruitment
router.delete("/:recruitmentId/:attachmentType", async (req, res, next) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input("recruitmentId", sql.NVarChar(30), req.params.recruitmentId)
      .input("attachmentType", sql.NVarChar(50), req.params.attachmentType)
      .query(`
        DELETE FROM dbo.RecruitmentAttachments
        WHERE RecruitmentId = @recruitmentId AND AttachmentType = @attachmentType
      `);
    res.json({ message: "Attachment deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
