import { useEffect, type FC } from 'react';
import { createPortal } from 'react-dom';
import '../styles/StatusModal.css';

interface StatusModalProps {
  open: boolean;
  success: boolean;
  message: string;
  onClose: () => void;
}

const StatusModal: FC<StatusModalProps> = ({ open, success, message, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const prev = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
    return () => { if (typeof document !== 'undefined') document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  const content = (
    <div className="status-modal-overlay" onClick={onClose}>
      <div className="status-modal-card" onClick={e => e.stopPropagation()}>
        <div className={`status-modal-message ${success ? 'success' : 'error'}`}>{message}</div>
        <button className="status-modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
  return createPortal(content, document.body);
};

export default StatusModal;
