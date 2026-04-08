import React from 'react';
import '../styles/StatusModal.css';

interface StatusModalProps {
  open: boolean;
  success: boolean;
  message: string;
  onClose: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({ open, success, message, onClose }) => {
  if (!open) return null;
  return (
    <div className="status-modal-overlay" onClick={onClose}>
      <div className="status-modal-card" onClick={e => e.stopPropagation()}>
        <div className={`status-modal-message ${success ? 'success' : 'error'}`}>{message}</div>
        <button className="status-modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default StatusModal;
