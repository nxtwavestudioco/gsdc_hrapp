import { Eye } from 'lucide-react';
import type { Employee } from './EmployeeModal';
import { fetchAttachmentImage } from '../utils/attachmentUtils';

export function AttachmentPreviewCell({ emp }: { emp: Employee }) {
  // List of attachment types to check
  const types = [
    'applicationFormAttachment',
    'certificateOfEmploymentAttachment',
    'medicalDiagnosticAttachment',
    'nbiClearanceAttachment',
    'policeClearanceAttachment',
    'barangayClearanceAttachment',
  ];

  // Find the first available attachment type for this employee
  const availableType = types.find(type => {
    const attachments = (emp as Record<string, unknown>)[type];
    return Array.isArray(attachments) && attachments.length > 0;
  });

  const handlePreview = async () => {
    if (!availableType || !emp.kamiId) return;
    const apiKey = import.meta.env.VITE_API_KEY;
    const url = `${import.meta.env.VITE_API_BASE_URL}/employees/${emp.kamiId}/attachments/${availableType}`;
    const imgUrl = await fetchAttachmentImage(url, apiKey);
    if (imgUrl) {
      window.open(imgUrl, '_blank');
    }
  };

  return (
    <span
      className={`attachment-eye${!availableType ? ' attachment-eye-disabled' : ''}`}
      title={availableType ? 'Preview attachment' : 'No attachment'}
      onClick={availableType ? handlePreview : undefined}
    >
      <Eye size={18} />
    </span>
  );
}
