import { useState, useEffect, type ChangeEvent, type FC } from 'react';
import '../styles/EmployeeModal.css';
import { fileToBase64, uploadAttachment } from '../utils/attachmentUtils';
import { Eye, ArrowDownToLine } from 'lucide-react';
import mammoth from 'mammoth';

export interface RecruitmentRequest {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  email: string;
  position: string;
  status: string;
  recruitmentId?: string;
  recruitmentDate?: string;
  resumeAttachment?: File | null;
  createdAt?: string;
}

interface Props {
  request: RecruitmentRequest | null;
  open: boolean;
  onClose: () => void;
  onSave: (req: RecruitmentRequest) => void;
}


interface RecruitmentModalProps extends Props {
  onDelete?: (req: RecruitmentRequest) => void;
}

const RecruitmentModal: FC<RecruitmentModalProps> = ({ request, open, onClose, onSave, onDelete }) => {
  // All hooks must be at the top level and never called conditionally
  const [form, setForm] = useState<RecruitmentRequest>(request || {
    id: 0,
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    email: '',
    position: '',
    status: '',
    recruitmentDate: '',
    resumeAttachment: null,
  });

  // Sync form with request prop when modal opens or request changes
  useEffect(() => {
    if (open && request) {
            setForm({
        ...request,
        firstName: request.firstName || '',
        middleName: request.middleName || '',
        lastName: request.lastName || '',
        phone: request.phone || '',
        email: request.email || '',
        position: request.position || '',
        status: request.status || '',
        recruitmentDate: request.recruitmentDate || '',
      });
    } else if (open && !request) {
      setForm({
        id: 0,
        firstName: '',
        middleName: '',
        lastName: '',
        phone: '',
        email: '',
        position: '',
        status: '',
        recruitmentDate: '',
        resumeAttachment: null,
      });
    }
  }, [open, request]);
  const [resumePreview, setResumePreview] = useState<string | null>(null);
  const [resumeMimeType, setResumeMimeType] = useState<string>('');
  const [resumeHtmlPreview, setResumeHtmlPreview] = useState<string | null>(null);
  const [hoveredAttachment, setHoveredAttachment] = useState<string | null>(null);

  // Compute applicantName as 'LastName, FirstName' to match Employee details
  const applicantName = [form.lastName, form.firstName].filter(Boolean).join(form.lastName && form.firstName ? ', ' : '');

  // Fetch preview for existing attachment on mount or when request changes
  useEffect(() => {
    if (!open) return;
    if (!form.recruitmentId) {
      if (resumePreview !== null) setResumePreview(null);
      setResumeMimeType('');
      setResumeHtmlPreview(null);
      return;
    }
    const apiKey = import.meta.env.VITE_API_KEY;
    const url = `${import.meta.env.VITE_API_BASE_URL}/recruitment-attachments/${form.recruitmentId}/file?type=resume`;
    fetch(url, { headers: { 'x-api-key': apiKey } })
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.blob();
      })
      .then(async blob => {
        setResumeMimeType(blob.type);
        setResumePreview(URL.createObjectURL(blob));
        // Pre-convert DOCX to HTML for hover preview
        if (blob.type.includes('word') || blob.type.includes('document')) {
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setResumeHtmlPreview(result.value);
          } catch {
            setResumeHtmlPreview(null);
          }
        } else {
          setResumeHtmlPreview(null);
        }
      })
      .catch(() => {
        setResumePreview(null);
        setResumeMimeType('');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.recruitmentId]);

  if (!open) return null;

  // Helper to convert to Proper Case (e.g., Juan Dela Cruz)
  function toProperCase(str: string) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (["firstName", "middleName", "lastName", "position", "status"].includes(name)) {
      formattedValue = toProperCase(value);
    } else if (name === "email") {
      formattedValue = value.toLowerCase();
    }
    setForm({ ...form, [name]: formattedValue });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files[0] && form.recruitmentId) {
      const file = files[0];
      const base64 = await fileToBase64(file);
      const apiKey = import.meta.env.VITE_API_KEY;
      const url = `${import.meta.env.VITE_API_BASE_URL}/recruitment-attachments/`;
      const success = await uploadAttachment({
        url,
        apiKey,
        base64Data: base64,
        method: 'POST',
        body: {
          recruitmentId: form.recruitmentId,
          attachmentType: 'resume',
        },
      });
      if (success) {
        const fileUrl = `${import.meta.env.VITE_API_BASE_URL}/recruitment-attachments/${form.recruitmentId}/file?type=resume`;
        const res = await fetch(fileUrl, { headers: { 'x-api-key': apiKey } });
        if (res.ok) {
          const blob = await res.blob();
          setResumeMimeType(blob.type);
          setResumePreview(URL.createObjectURL(blob));
          if (blob.type.includes('word') || blob.type.includes('document')) {
            try {
              const arrayBuffer = await blob.arrayBuffer();
              const result = await mammoth.convertToHtml({ arrayBuffer });
              setResumeHtmlPreview(result.value);
            } catch {
              setResumeHtmlPreview(null);
            }
          } else {
            setResumeHtmlPreview(null);
          }
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation: Position and Status required
    if (!form.position) {
      alert('Position is required.');
      return;
    }
    if (!form.status) {
      alert('Status is required.');
      return;
    }
    if (!form.recruitmentDate) {
      alert('Recruitment Date is required.');
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={handleSubmit} autoComplete="off">
        <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">×</button>
        {/* Modal Header */}
        <div className="recruitment-modal-title-wrap">
          <h2 className="recruitment-modal-title">Applicant Details</h2>
        </div>
        {/* Aligned Recruitment ID and Full Name in one row, larger fields */}
        <div className="recruitment-header-row">
          <div className="recruitment-header-col">
            <label className="recruitment-header-label">Recruitment ID</label>
            <input className="recruitment-header-input recruitment-id-input" value={form.recruitmentId || ''} disabled aria-label="Recruitment ID" />
          </div>
          <div className="recruitment-header-col">
            <label className="recruitment-header-label">Recruitment Date</label>
            <input type="date" className="recruitment-header-input recruitment-date-input" name="recruitmentDate" value={form.recruitmentDate || ''} onChange={handleChange} aria-label="Recruitment Date" required />
          </div>
          <div className="recruitment-header-col">
            <label className="recruitment-header-label">Full Name</label>
            <input className="recruitment-header-input recruitment-fullname-input" value={applicantName} disabled aria-label="Full Name" />
          </div>
        </div>
        <div className="modal-fields-3col">
          <div className="modal-fields-row">
            <div className="modal-field-cell">
              <label htmlFor="firstName" className="recruitment-field-label">First Name</label>
              <input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} className="modal-field-input" autoCapitalize="words" />
            </div>
            <div className="modal-field-cell">
              <label htmlFor="middleName" className="recruitment-field-label">Middle Name</label>
              <input id="middleName" name="middleName" value={form.middleName} onChange={handleChange} className="modal-field-input" autoCapitalize="words" />
            </div>
            <div className="modal-field-cell">
              <label htmlFor="lastName" className="recruitment-field-label">Last Name</label>
              <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} className="modal-field-input" autoCapitalize="words" />
            </div>
          </div>
          <div className="modal-fields-row">
            <div className="modal-field-cell">
              <label htmlFor="phone" className="recruitment-field-label">Phone</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} className="modal-field-input" />
            </div>
            <div className="modal-field-cell">
              <label htmlFor="email" className="recruitment-field-label">Email</label>
              <input id="email" name="email" value={form.email} onChange={handleChange} className="modal-field-input" autoCapitalize="none" />
            </div>
            <div className="modal-field-cell">
              <label htmlFor="position" className="recruitment-field-label">Position</label>
              <select id="position" name="position" value={form.position || ''} onChange={handleChange} className="modal-field-input" required>
                <option value="" disabled>Select Position</option>
                <option value="Driver">Driver</option>
                <option value="Helper">Helper</option>
              </select>
            </div>
          </div>
          <div className="modal-fields-row">
            <div className="modal-field-cell">
              <label htmlFor="status" className="recruitment-field-label">Status</label>
              <select id="status" name="status" value={form.status || ''} onChange={handleChange} className="modal-field-input" required>
                <option value="" disabled>Select Status</option>
                <option value="On Going Requirements">On Going Requirements</option>
                <option value="Backdown">Backdown</option>
              </select>
            </div>
          </div>
        </div>
        <div className="attachments-section">
          <h4 className="text-lg font-semibold mb-4 text-blue-900 border-b pb-2 text-center">Attachments</h4>
          <div className="attachments-grid">
            <div className="attachment-card">
              <span className="font-semibold">Resume</span>
              <input type="file" name="resumeAttachment" onChange={handleFileChange} aria-label="Resume Attachment" />
              <span
                onMouseEnter={() => resumePreview && setHoveredAttachment('resume')}
                onMouseLeave={() => setHoveredAttachment(null)}
                className={`attachment-eye${!resumePreview ? ' attachment-eye-disabled' : ''}`}
                onClick={async () => {
                  if (!resumePreview) return;
                  const previewWindow = window.open('', '_blank');
                  if (!previewWindow) return;
                  if (resumeMimeType.startsWith('image/')) {
                    previewWindow.document.write(`<html><head><title>Resume Preview</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1e1e1e"><img src="${resumePreview}" style="max-width:100%;max-height:100vh;object-fit:contain"/></body></html>`);
                    previewWindow.document.close();
                  } else if (resumeMimeType.includes('word') || resumeMimeType.includes('document')) {
                    previewWindow.document.write(`<html><head><title>Resume Preview</title></head><body style="padding:2rem;font-family:sans-serif"><p>Loading DOCX preview...</p></body></html>`);
                    try {
                      const res = await fetch(resumePreview);
                      const arrayBuffer = await res.arrayBuffer();
                      const result = await mammoth.convertToHtml({ arrayBuffer });
                      previewWindow.document.open();
                      previewWindow.document.write(`<html><head><title>Resume Preview</title><style>body{max-width:900px;margin:2rem auto;padding:0 2rem;font-family:Segoe UI,sans-serif;line-height:1.6;color:#1e293b}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #cbd5e1;padding:8px}</style></head><body>${result.value}</body></html>`);
                      previewWindow.document.close();
                    } catch {
                      previewWindow.document.open();
                      previewWindow.document.write(`<html><head><title>Resume Preview</title></head><body style="padding:2rem;font-family:sans-serif;text-align:center"><p>Could not render DOCX preview. <a href="${resumePreview}" download="Resume">Download file</a></p></body></html>`);
                      previewWindow.document.close();
                    }
                  } else {
                    previewWindow.document.write(`<html><head><title>Resume Preview</title></head><body style="margin:0"><object data="${resumePreview}" type="${resumeMimeType}" width="100%" height="100%" style="min-height:100vh"><p style="padding:2rem;font-family:sans-serif;text-align:center">Preview not available. <a href="${resumePreview}" download="Resume">Download file</a></p></object></body></html>`);
                    previewWindow.document.close();
                  }
                }}
              >
                <Eye size={18} />
                {hoveredAttachment === 'resume' && resumePreview && resumeMimeType.startsWith('image/') && (
                  <img src={resumePreview} alt="Preview" className="attachment-preview-pop" />
                )}
                {hoveredAttachment === 'resume' && resumePreview && resumeHtmlPreview && (
                  <iframe
                    srcDoc={`<html><head><style>body{font-family:Segoe UI,sans-serif;font-size:8px;line-height:1.4;padding:6px;margin:0;color:#1e293b;overflow:hidden}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #cbd5e1;padding:2px;font-size:7px}</style></head><body>${resumeHtmlPreview}</body></html>`}
                    className="attachment-preview-pop"
                    title="Preview"
                  />
                )}
                {hoveredAttachment === 'resume' && resumePreview && resumeMimeType.includes('pdf') && (
                  <iframe
                    src={resumePreview}
                    className="attachment-preview-pop"
                    title="Preview"
                  />
                )}
              </span>
              {resumePreview && (
                <>
                  <button
                    type="button"
                    className="remove-attachment-btn"
                    title="Remove attachment"
                    onClick={async () => {
                      const apiKey = import.meta.env.VITE_API_KEY;
                      const url = `${import.meta.env.VITE_API_BASE_URL}/recruitment-attachments/${form.recruitmentId}/resume`;
                      await fetch(url, { method: 'DELETE', headers: { 'x-api-key': apiKey } });
                      setResumePreview(null);
                      setResumeMimeType('');
                      setResumeHtmlPreview(null);
                    }}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    className="download-attachment-btn"
                    title="Download attachment"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = resumePreview!;
                      link.download = 'Resume';
                      link.click();
                    }}
                  >
                    <ArrowDownToLine size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="recruitment-actions-row">
          {form.id !== 0 && onDelete && (
            <button
              type="button"
              className="recruitment-btn-delete"
              onClick={() => onDelete(form)}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            className="recruitment-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="recruitment-btn-save"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecruitmentModal;
