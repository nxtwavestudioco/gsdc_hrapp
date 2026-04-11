import '../styles/EmployeeModal.css';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fileToBase64, fetchAttachmentImage, uploadAttachment } from '../utils/attachmentUtils';
import { Eye, ArrowDownToLine } from 'lucide-react';

export type Employee = {
  id: number;
  kamiId: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName: string;
  address?: string;
  civilStatus?: string;
  placeOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  employer?: string;
  bu: string;
  position: string;
  drivingExperience?: string;
  positionStatus?: string;
  status?: string;
  employmentStatus: string;
  assignment?: string;
  driversLicense?: string;
  restrictioncode?: string;
  driversLicenseExpiryDate?: string;
  sssNumber?: string;
  pagibigNumber?: string;
  philHealthNumber?: string;
  tinNumber?: string;
  updatedAt?: string;
  gender?: string;
  contactNumber?: string;
  email?: string;
  applicationFormAttachment?: string[];
  certificateOfEmploymentAttachment?: string[];
  medicalDiagnosticAttachment?: string[];
  nbiClearanceAttachment?: string[];
  policeClearanceAttachment?: string[];
  barangayClearanceAttachment?: string[];
  dateHired?: string;
  tenure?: { years: number; months: number; days: number } | null;
}


interface Props {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  onSave: (emp: Employee, attachments: File[]) => void;
}


const EmployeeModal = ({ employee, open, onClose, onSave }: Props): React.ReactElement | null => {
  // All hooks must be at the top level
  // Use derived state for form to avoid setState in useEffect
  const initialForm: Employee = employee || {
    id: 0,
    kamiId: 0,
    firstName: '',
    middleName: '',
    lastName: '',
    fullName: '',
    address: '',
    civilStatus: '',
    placeOfBirth: '',
    fatherName: '',
    motherName: '',
    employer: '',
    bu: '',
    position: '',
    drivingExperience: '', // keep as string for input, convert on save
    positionStatus: '',
    status: '',
    employmentStatus: '',
    assignment: '',
    driversLicense: '',
    restrictioncode: '',
    driversLicenseExpiryDate: '',
    sssNumber: '',
    pagibigNumber: '',
    philHealthNumber: '',
    tinNumber: '',
    updatedAt: '',
    gender: '',
    contactNumber: '',
    email: '',
    applicationFormAttachment: [],
    certificateOfEmploymentAttachment: [],
    medicalDiagnosticAttachment: [],
    nbiClearanceAttachment: [],
    policeClearanceAttachment: [],
    barangayClearanceAttachment: [],
  };
  const [form, setForm] = useState<Employee>(initialForm);
  // Keep form in sync with employee prop only when modal is opened
  React.useEffect(() => {
    if (open && employee) {
      setForm(employee);
    } else if (open && !employee) {
      setForm(initialForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<Record<string, string | null>>({});
  const [hoveredAttachment, setHoveredAttachment] = useState<string | null>(null);

  // Sync form with employee prop
  useEffect(() => {
    if (employee) setForm(employee);
  }, [employee]);

  // Fetch previews for existing attachments on mount or when employee changes
  useEffect(() => {
    if (!open || !form.kamiId || !form.fullName) return;
    const apiKey = import.meta.env.VITE_API_KEY;
    const fetchAll = async () => {
      // Map UI field names to backend types
      const typeMap: Record<string, string> = {
        applicationFormAttachment: 'applicationForm',
        certificateOfEmploymentAttachment: 'certificateOfEmployment',
        medicalDiagnosticAttachment: 'medicalDiagnostic',
        nbiClearanceAttachment: 'nbiClearance',
        policeClearanceAttachment: 'policeClearance',
        barangayClearanceAttachment: 'barangayClearance',
      };
      const types = Object.keys(typeMap);
      const previews: Record<string, string | null> = {};
      for (const type of types) {
        const url = `${import.meta.env.VITE_API_BASE_URL}/employees/${form.kamiId}/attachments/${typeMap[type]}`;
        previews[type] = await fetchAttachmentImage(url, apiKey);
      }
      setAttachmentPreviews(previews);
    };
    fetchAll();
  }, [open, form.kamiId, form.fullName]);

  // prevent body scrolling while modal is open
  useEffect(() => {
    const prev = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (open && typeof document !== 'undefined') document.body.style.overflow = 'hidden';
    return () => { if (typeof document !== 'undefined') document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const base64 = await fileToBase64(file);
      const apiKey = import.meta.env.VITE_API_KEY;
      // Map UI field names to backend types
      const typeMap: Record<string, string> = {
        applicationFormAttachment: 'applicationForm',
        certificateOfEmploymentAttachment: 'certificateOfEmployment',
        medicalDiagnosticAttachment: 'medicalDiagnostic',
        nbiClearanceAttachment: 'nbiClearance',
        policeClearanceAttachment: 'policeClearance',
        barangayClearanceAttachment: 'barangayClearance',
      };
      const backendType = typeMap[name] || name;
      const url = `${import.meta.env.VITE_API_BASE_URL}/employees/${form.kamiId}/attachments/${backendType}`;
      const success = await uploadAttachment({ url, apiKey, base64Data: base64 });
      if (success) {
        const imgUrl = await fetchAttachmentImage(url, apiKey);
        setAttachmentPreviews(prev => ({ ...prev, [name]: imgUrl }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form) onSave(form, []);
  };

  const modalNode = (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-card"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <button
          type="button"
          className="modal-close-x"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <header>
          <span>Employee Profile</span>
          <h3>{form.fullName}</h3>
          {employee?.tenure && (
            <div className="employee-tenure-info">
              Tenure: Active for {employee.tenure.years} year{employee.tenure.years !== 1 ? 's' : ''}, {employee.tenure.months} month{employee.tenure.months !== 1 ? 's' : ''}, {employee.tenure.days} day{employee.tenure.days !== 1 ? 's' : ''}
            </div>
          )}
        </header>
        <section>
          <div className="modal-fields-3col">
            <div className="modal-fields-row first-row">
              <div className="modal-field-cell kamiid-cell">
                <label htmlFor="kamiId">KAMI ID</label>
                <input id="kamiId" name="kamiId" value={form.kamiId} disabled className="kamiid-input" />
              </div>
              <div className="modal-field-cell fullname-cell">
                <label htmlFor="fullName">Full Name</label>
                <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} className="fullname-input" />
              </div>
              <div className="modal-field-cell address-cell">
                <label htmlFor="address">Address</label>
                <input id="address" name="address" value={form.address || ''} onChange={handleChange} placeholder="Enter address" className="address-input" />
              </div>
            </div>
            <div className="modal-fields-row">
              <div className="modal-field-cell costcenter-cell">
                <label htmlFor="bu">Cost Center</label>
                <input id="bu" name="bu" value={form.bu} disabled className="modal-field-input" />
              </div>
              <div className="modal-field-cell areaassignment-cell">
                <label htmlFor="assignment">Area Assignment</label>
                <select id="assignment" name="assignment" value={form.assignment || ''} onChange={handleChange} className="modal-field-input">
                  <option value="">Select Area Assignment</option>
                  <option value="VASQUEZ">VASQUEZ</option>
                  <option value="INTERCITY">INTERCITY</option>
                  <option value="ANTIPOLO">ANTIPOLO</option>
                  <option value="LINGUNAN">LINGUNAN</option>
                  <option value="GEOMAX">GEOMAX</option>
                  <option value="LAGUNA">LAGUNA</option>
                  <option value="LUGAIT">LUGAIT</option>
                  <option value="DAVAO">DAVAO</option>
                  <option value="CEBU">CEBU</option>
                </select>
              </div>
              <div className="modal-field-cell status-cell">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={form.status || ''} onChange={handleChange} className="modal-field-input">
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>
            <div className="modal-fields-row">
              <div className="modal-field-cell">
                <label htmlFor="employmentStatus">Employment Status</label>
                <select id="employmentStatus" name="employmentStatus" value={form.employmentStatus} onChange={handleChange} className="modal-field-input">
                  <option value="">Select Employment Status</option>
                  <option value="Regular">Regular</option>
                  <option value="Probationary">Probationary</option>
                  <option value="AWOL">AWOL</option>
                </select>
              </div>
              <div className="modal-field-cell">
                <label htmlFor="positionStatus">Position</label>
                <select id="positionStatus" name="positionStatus" value={form.positionStatus || ''} onChange={handleChange} className="modal-field-input">
                  <option value="">Select Position</option>
                  <option value="Driver">Driver</option>
                  <option value="Helper">Helper</option>
                </select>
              </div>
              <div className="modal-field-cell">
                <label htmlFor="civilStatus">Civil Status</label>
                <select id="civilStatus" name="civilStatus" value={form.civilStatus || ''} onChange={handleChange} className="modal-field-input">
                  <option value="">Select Civil Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>
            <div className="modal-fields-row">
              <div className="modal-field-cell">
                <label htmlFor="placeOfBirth">Birthplace</label>
                <input id="placeOfBirth" name="placeOfBirth" value={form.placeOfBirth || ''} onChange={handleChange} className="modal-field-input" />
              </div>
              <div className="modal-field-cell">
                <label htmlFor="drivingExperience">Driving Exp.</label>
                <input id="drivingExperience" name="drivingExperience" value={form.drivingExperience || ''} onChange={handleChange} className="modal-field-input" />
              </div>
              <div className="modal-field-cell">
                <label htmlFor="driversLicense">Driver Lic.</label>
                <input id="driversLicense" name="driversLicense" value={form.driversLicense || ''} onChange={handleChange} className="modal-field-input" />
              </div>
            </div>
            <div className="modal-fields-row">
              <div className="modal-field-cell">
                <label htmlFor="restrictioncode">Restriction</label>
                <input id="restrictioncode" name="restrictioncode" value={form.restrictioncode || ''} onChange={handleChange} className="modal-field-input" />
              </div>
              <div className="modal-field-cell">
                <label htmlFor="driversLicenseExpiryDate">License Exp.</label>
                <input id="driversLicenseExpiryDate" name="driversLicenseExpiryDate" type="date" value={form.driversLicenseExpiryDate || ''} onChange={handleChange} className="modal-field-input" />
              </div>
              <div className="modal-field-cell">
                <label htmlFor="sssNumber">SSS</label>
                <input id="sssNumber" name="sssNumber" value={form.sssNumber || ''} onChange={handleChange} className="modal-field-input" />
              </div>
            </div>
            <div className="modal-fields-row">
              <div className="modal-field-cell">
                <label htmlFor="pagibigNumber">Pag-IBIG</label>
                <input id="pagibigNumber" name="pagibigNumber" value={form.pagibigNumber || ''} onChange={handleChange} className="modal-field-input" />
              </div>
              <div className="modal-field-cell">
                <label htmlFor="philHealthNumber">PhilHealth</label>
                <input id="philHealthNumber" name="philHealthNumber" value={form.philHealthNumber || ''} onChange={handleChange} className="modal-field-input" />
              </div>
              <div className="modal-field-cell">
                <label htmlFor="tinNumber">TIN</label>
                <input id="tinNumber" name="tinNumber" value={form.tinNumber || ''} onChange={handleChange} className="modal-field-input" />
              </div>
            </div>
          </div>
        </section>
        <div className="attachments-section">
          <h4 className="text-lg font-semibold mb-4 text-blue-900 border-b pb-2 text-center">Attachments</h4>
          <div className="attachments-grid">
            <div className="attachment-card">
              <span className="font-semibold">Application Form</span>
              <input type="file" name="applicationFormAttachment" onChange={handleFileChange} aria-label="Application Form Attachment" />
              <span
                onMouseEnter={() => attachmentPreviews.applicationFormAttachment && setHoveredAttachment('applicationFormAttachment')}
                onMouseLeave={() => setHoveredAttachment(null)}
                className={`attachment-eye${!attachmentPreviews.applicationFormAttachment ? ' attachment-eye-disabled' : ''}`}
                onClick={() => attachmentPreviews.applicationFormAttachment && window.open(attachmentPreviews.applicationFormAttachment, '_blank')}
              >
                <Eye size={18} />
                {hoveredAttachment === 'applicationFormAttachment' && attachmentPreviews.applicationFormAttachment && (
                  <img src={attachmentPreviews.applicationFormAttachment} alt="Preview" className="attachment-preview-pop" />
                )}
              </span>
              {attachmentPreviews.applicationFormAttachment && (
                <>
                  <button
                    type="button"
                    className="remove-attachment-btn"
                    title="Remove attachment"
                    onClick={async () => {
                      const apiKey = import.meta.env.VITE_API_KEY;
                      const url = `${import.meta.env.VITE_API_BASE_URL}/employees/${form.kamiId}/attachments/applicationForm`;
                      await fetch(url, { method: 'DELETE', headers: { 'x-api-key': apiKey } });
                      setAttachmentPreviews(prev => ({ ...prev, applicationFormAttachment: null }));
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
                      link.href = attachmentPreviews.applicationFormAttachment!;
                      link.download = 'ApplicationForm';
                      link.click();
                    }}
                  >
                    <ArrowDownToLine size={18} />
                  </button>
                </>
              )}
            </div>
            <div className="attachment-card">
              <span className="font-semibold">Certificate of Employment</span>
              <input type="file" name="certificateOfEmploymentAttachment" onChange={handleFileChange} aria-label="Certificate of Employment Attachment" />
              <span
                onMouseEnter={() => attachmentPreviews.certificateOfEmploymentAttachment && setHoveredAttachment('certificateOfEmploymentAttachment')}
                onMouseLeave={() => setHoveredAttachment(null)}
                className={`attachment-eye${!attachmentPreviews.certificateOfEmploymentAttachment ? ' attachment-eye-disabled' : ''}`}
                onClick={() => attachmentPreviews.certificateOfEmploymentAttachment && window.open(attachmentPreviews.certificateOfEmploymentAttachment, '_blank')}
              >
                <Eye size={18} />
                {hoveredAttachment === 'certificateOfEmploymentAttachment' && attachmentPreviews.certificateOfEmploymentAttachment && (
                  <img src={attachmentPreviews.certificateOfEmploymentAttachment} alt="Preview" className="attachment-preview-pop" />
                )}
              </span>
              {attachmentPreviews.certificateOfEmploymentAttachment && (
                <>
                  <button
                    type="button"
                    className="remove-attachment-btn"
                    title="Remove attachment"
                    onClick={async () => {
                      const apiKey = import.meta.env.VITE_API_KEY;
                      const url = `${import.meta.env.VITE_API_BASE_URL}/employees/${form.kamiId}/attachments/certificateOfEmployment`;
                      await fetch(url, { method: 'DELETE', headers: { 'x-api-key': apiKey } });
                      setAttachmentPreviews(prev => ({ ...prev, certificateOfEmploymentAttachment: null }));
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
                      link.href = attachmentPreviews.certificateOfEmploymentAttachment!;
                      link.download = 'CertificateOfEmployment';
                      link.click();
                    }}
                  >
                    <ArrowDownToLine size={18} />
                  </button>
                </>
              )}
            </div>
            <div className="attachment-card">
              <span className="font-semibold">Medical Diagnostic</span>
              <input type="file" name="medicalDiagnosticAttachment" onChange={handleFileChange} aria-label="Medical Diagnostic Attachment" />
              <span
                onMouseEnter={() => attachmentPreviews.medicalDiagnosticAttachment && setHoveredAttachment('medicalDiagnosticAttachment')}
                onMouseLeave={() => setHoveredAttachment(null)}
                className={`attachment-eye${!attachmentPreviews.medicalDiagnosticAttachment ? ' attachment-eye-disabled' : ''}`}
                onClick={() => attachmentPreviews.medicalDiagnosticAttachment && window.open(attachmentPreviews.medicalDiagnosticAttachment, '_blank')}
              >
                <Eye size={18} />
                {hoveredAttachment === 'medicalDiagnosticAttachment' && attachmentPreviews.medicalDiagnosticAttachment && (
                  <img src={attachmentPreviews.medicalDiagnosticAttachment} alt="Preview" className="attachment-preview-pop" />
                )}
              </span>
              {attachmentPreviews.medicalDiagnosticAttachment && (
                <>
                  <button
                    type="button"
                    className="remove-attachment-btn"
                    title="Remove attachment"
                    onClick={async () => {
                      const apiKey = import.meta.env.VITE_API_KEY;
                      const url = `${import.meta.env.VITE_API_BASE_URL}/employees/${form.kamiId}/attachments/medicalDiagnostic`;
                      await fetch(url, { method: 'DELETE', headers: { 'x-api-key': apiKey } });
                      setAttachmentPreviews(prev => ({ ...prev, medicalDiagnosticAttachment: null }));
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
                      link.href = attachmentPreviews.medicalDiagnosticAttachment!;
                      link.download = 'MedicalDiagnostic';
                      link.click();
                    }}
                  >
                    <ArrowDownToLine size={18} />
                  </button>
                </>
              )}
            </div>
            <div className="attachment-card">
              <span className="font-semibold">NBI Clearance</span>
              <input type="file" name="nbiClearanceAttachment" onChange={handleFileChange} aria-label="NBI Clearance Attachment" />
              <span
                onMouseEnter={() => attachmentPreviews.nbiClearanceAttachment && setHoveredAttachment('nbiClearanceAttachment')}
                onMouseLeave={() => setHoveredAttachment(null)}
                className={`attachment-eye${!attachmentPreviews.nbiClearanceAttachment ? ' attachment-eye-disabled' : ''}`}
                onClick={() => attachmentPreviews.nbiClearanceAttachment && window.open(attachmentPreviews.nbiClearanceAttachment, '_blank')}
              >
                <Eye size={18} />
                {hoveredAttachment === 'nbiClearanceAttachment' && attachmentPreviews.nbiClearanceAttachment && (
                  <img src={attachmentPreviews.nbiClearanceAttachment} alt="Preview" className="attachment-preview-pop" />
                )}
              </span>
              {attachmentPreviews.nbiClearanceAttachment && (
                <>
                  <button
                    type="button"
                    className="remove-attachment-btn"
                    title="Remove attachment"
                    onClick={async () => {
                      const apiKey = import.meta.env.VITE_API_KEY;
                      const url = `${import.meta.env.VITE_API_BASE_URL}/employees/${form.kamiId}/attachments/nbiClearance`;
                      await fetch(url, { method: 'DELETE', headers: { 'x-api-key': apiKey } });
                      setAttachmentPreviews(prev => ({ ...prev, nbiClearanceAttachment: null }));
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
                      link.href = attachmentPreviews.nbiClearanceAttachment!;
                      link.download = 'NBIClearance';
                      link.click();
                    }}
                  >
                    <ArrowDownToLine size={18} />
                  </button>
                </>
              )}
            </div>
            <div className="attachment-card">
              <span className="font-semibold">Police Clearance</span>
              <input type="file" name="policeClearanceAttachment" onChange={handleFileChange} aria-label="Police Clearance Attachment" />
              <span
                onMouseEnter={() => attachmentPreviews.policeClearanceAttachment && setHoveredAttachment('policeClearanceAttachment')}
                onMouseLeave={() => setHoveredAttachment(null)}
                className={`attachment-eye${!attachmentPreviews.policeClearanceAttachment ? ' attachment-eye-disabled' : ''}`}
                onClick={() => attachmentPreviews.policeClearanceAttachment && window.open(attachmentPreviews.policeClearanceAttachment, '_blank')}
              >
                <Eye size={18} />
                {hoveredAttachment === 'policeClearanceAttachment' && attachmentPreviews.policeClearanceAttachment && (
                  <img src={attachmentPreviews.policeClearanceAttachment} alt="Preview" className="attachment-preview-pop" />
                )}
              </span>
              {attachmentPreviews.policeClearanceAttachment && (
                <>
                  <button
                    type="button"
                    className="remove-attachment-btn"
                    title="Remove attachment"
                    onClick={async () => {
                      const apiKey = import.meta.env.VITE_API_KEY;
                      const url = `${import.meta.env.VITE_API_BASE_URL}/employees/${form.kamiId}/attachments/policeClearance`;
                      await fetch(url, { method: 'DELETE', headers: { 'x-api-key': apiKey } });
                      setAttachmentPreviews(prev => ({ ...prev, policeClearanceAttachment: null }));
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
                      link.href = attachmentPreviews.policeClearanceAttachment!;
                      link.download = 'PoliceClearance';
                      link.click();
                    }}
                  >
                    <ArrowDownToLine size={18} />
                  </button>
                </>
              )}
            </div>
            <div className="attachment-card">
              <span className="font-semibold">Barangay Clearance</span>
              <input type="file" name="barangayClearanceAttachment" onChange={handleFileChange} aria-label="Barangay Clearance Attachment" />
              <span
                onMouseEnter={() => attachmentPreviews.barangayClearanceAttachment && setHoveredAttachment('barangayClearanceAttachment')}
                onMouseLeave={() => setHoveredAttachment(null)}
                className={`attachment-eye${!attachmentPreviews.barangayClearanceAttachment ? ' attachment-eye-disabled' : ''}`}
                onClick={() => attachmentPreviews.barangayClearanceAttachment && window.open(attachmentPreviews.barangayClearanceAttachment, '_blank')}
              >
                <Eye size={18} />
                {hoveredAttachment === 'barangayClearanceAttachment' && attachmentPreviews.barangayClearanceAttachment && (
                  <img src={attachmentPreviews.barangayClearanceAttachment} alt="Preview" className="attachment-preview-pop" />
                )}
              </span>
              {attachmentPreviews.barangayClearanceAttachment && (
                <>
                  <button
                    type="button"
                    className="remove-attachment-btn"
                    title="Remove attachment"
                    onClick={async () => {
                      const apiKey = import.meta.env.VITE_API_KEY;
                      const url = `${import.meta.env.VITE_API_BASE_URL}/employees/${form.kamiId}/attachments/barangayClearance`;
                      await fetch(url, { method: 'DELETE', headers: { 'x-api-key': apiKey } });
                      setAttachmentPreviews(prev => ({ ...prev, barangayClearanceAttachment: null }));
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
                      link.href = attachmentPreviews.barangayClearanceAttachment!;
                      link.download = 'BarangayClearance';
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
        <div className="modal-actions-row mt-4">
          <button type="submit" className="sidebar-btn modal-action-save">Save</button>
        </div>
      </form>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalNode, document.body);
  }
  return null;

};

export { EmployeeModal };
