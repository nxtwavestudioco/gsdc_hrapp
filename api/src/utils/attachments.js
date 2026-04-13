function normalizeBase64(input) {
  const raw = String(input || "").trim();
  const comma = raw.indexOf(",");
  if (comma >= 0) {
    return raw.slice(comma + 1).replace(/\s+/g, "");
  }
  return raw.replace(/\s+/g, "");
}

function toBuffer(base64OrDataUrl) {
  const normalized = normalizeBase64(base64OrDataUrl);
  if (!normalized) return null;
  return Buffer.from(normalized, "base64");
}

const ATTACHMENT_TYPES = [
  "Application Form",
  "Certificate of Employment",
  "Medical Diagnostic",
  "NBI Clearance",
  "Police Clearance",
  "Barangay Clearance"
];

function normalizeAttachmentType(type) {
  const key = String(type || "").trim().toLowerCase();
  if (!key) return null;

  const aliases = {
    "application form": "Application Form",
    "application-form": "Application Form",
    applicationform: "Application Form",
    "certificate of employment": "Certificate of Employment",
    "certificate-of-employment": "Certificate of Employment",
    certificateofemployment: "Certificate of Employment",
    "certificate of employement": "Certificate of Employment",
    "certificate-of-employement": "Certificate of Employment",
    certificateofemployement: "Certificate of Employment",
    "medical diagnostic": "Medical Diagnostic",
    "medical-diagnostic": "Medical Diagnostic",
    medicaldiagnostic: "Medical Diagnostic",
    "nbi clearance": "NBI Clearance",
    "nbi-clearance": "NBI Clearance",
    nbiclearance: "NBI Clearance",
    "police clearance": "Police Clearance",
    "police-clearance": "Police Clearance",
    policeclearance: "Police Clearance",
    "barangay clearance": "Barangay Clearance",
    "barangay-clearance": "Barangay Clearance",
    barangayclearance: "Barangay Clearance"
  };

  return aliases[key] || null;
}

module.exports = { toBuffer, normalizeAttachmentType, ATTACHMENT_TYPES };
