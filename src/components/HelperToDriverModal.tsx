import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye } from 'lucide-react';

interface HelperOption {
  KAMIId: number;
  FullName: string;
  Assignment: string;
  BU: string;
}

export interface HelperToDriverRequest {
  id: number;
  helperName: string;
  currentAssignment: string;
  status: string;
  costCenter: string;
  areaAssignment: string;
  startDate: string;
  completionDate: string;
  conversionAttachment?: File | null;
  createdAt?: string;
}

interface Props {
  request: HelperToDriverRequest | null;
  open: boolean;
  onClose: () => void;
  onSave: (req: HelperToDriverRequest) => void;
}

const HelperToDriverModal: React.FC<Props> = ({ request, open, onClose, onSave }) => {
  const [form, setForm] = useState<HelperToDriverRequest>(request || {
    id: 0,
    helperName: '',
    currentAssignment: '',
    status: '',
    costCenter: '',
    areaAssignment: '',
    startDate: '',
    completionDate: '',
    conversionAttachment: null,
  });
  const [helpersList, setHelpersList] = useState<HelperOption[]>([]);

  useEffect(() => {
    setForm(request || {
      id: 0,
      helperName: '',
      currentAssignment: '',
      status: '',
      costCenter: '',
      areaAssignment: '',
      startDate: '',
      completionDate: '',
      conversionAttachment: null,
    });
  }, [request]);

  useEffect(() => {
    if (!open) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/helper-to-driver/helpers-list`, {
      headers: { 'x-api-key': import.meta.env.VITE_API_KEY },
    })
      .then(res => res.json())
      .then(data => setHelpersList(Array.isArray(data) ? data : []))
      .catch(() => setHelpersList([]));
  }, [open]);

  useEffect(() => {
    const prev = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (open && typeof document !== 'undefined') document.body.style.overflow = 'hidden';
    return () => { if (typeof document !== 'undefined') document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleHelperSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = helpersList.find(h => h.FullName === e.target.value);
    setForm({
      ...form,
      helperName: e.target.value,
      areaAssignment: selected?.Assignment || '',
      costCenter: selected?.BU || '',
      id: selected?.KAMIId || form.id,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setForm({ ...form, conversionAttachment: file });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={e => e.stopPropagation()} onSubmit={handleSubmit} autoComplete="off">
        <button type="button" className="modal-close-x" onClick={onClose} aria-label="Close">×</button>
        <header className="mb-8 border-b pb-4 flex flex-col gap-1 items-center">
          <span className="text-xs uppercase tracking-widest text-blue-500 font-bold">HELPER TO DRIVER PROGRAM</span>
          <h3 className="text-4xl font-extrabold text-blue-900">{form.helperName}</h3>
        </header>
        <section>
          <div className="col-span-1 flex flex-col items-center">
            <label className="mb-1 font-semibold text-gray-700" htmlFor="helperName">Helper Name</label>
            <select id="helperName" name="helperName" value={form.helperName} onChange={handleHelperSelect} className="center-text">
              <option value="">-- Select Helper --</option>
              {helpersList.map(h => (
                <option key={h.KAMIId} value={h.FullName}>{h.FullName}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1 flex flex-col items-center">
            <label className="mb-1 font-semibold text-gray-700" htmlFor="costCenter">Cost Center</label>
            <input id="costCenter" name="costCenter" value={form.costCenter} onChange={handleChange} className="center-text" />
          </div>
          <div className="col-span-1 flex flex-col items-center">
            <label className="mb-1 font-semibold text-gray-700" htmlFor="areaAssignment">Area Assignment</label>
            <input id="areaAssignment" name="areaAssignment" value={form.areaAssignment} onChange={handleChange} className="center-text" />
          </div>
          <div className="col-span-1 flex flex-col items-center">
            <label className="mb-1 font-semibold text-gray-700" htmlFor="status">Status</label>
            <input id="status" name="status" value={form.status} onChange={handleChange} className="center-text" />
          </div>
          <div className="col-span-1 flex flex-col items-center">
            <label className="mb-1 font-semibold text-gray-700" htmlFor="startDate">Start Date</label>
            <input id="startDate" name="startDate" type="date" value={form.startDate ? form.startDate.substring(0, 10) : ''} onChange={handleChange} className="center-text" />
          </div>
          <div className="col-span-1 flex flex-col items-center">
            <label className="mb-1 font-semibold text-gray-700" htmlFor="completionDate">Completion Date</label>
            <input id="completionDate" name="completionDate" type="date" value={form.completionDate ? form.completionDate.substring(0, 10) : ''} onChange={handleChange} className="center-text" />
          </div>
        </section>
        <div className="attachments-section">
          <h4 className="text-lg font-semibold mb-4 text-blue-900 border-b pb-2 text-center">Attachments</h4>
          <div className="attachments-grid">
            <div className="attachment-card">
              <span className="font-semibold">Driver's License</span>
              <input type="file" name="conversionAttachment" onChange={handleFileChange} aria-label="Conversion Attachment" />
              {form.conversionAttachment ? (
                <div className="text-xs mt-1 text-gray-500">{form.conversionAttachment.name}</div>
              ) : (
                <span className="attachment-eye attachment-eye-disabled" title="No attachment available">
                  <Eye size={18} style={{ opacity: 0.3 }} />
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <button type="button" className="sidebar-btn modal-action" onClick={onClose}>Cancel</button>
          <button type="submit" className="sidebar-btn modal-action">Save</button>
        </div>
      </form>
    </div>
  );

  return createPortal(modalContent, typeof document !== 'undefined' ? document.body : null as any);
};

export default HelperToDriverModal;
