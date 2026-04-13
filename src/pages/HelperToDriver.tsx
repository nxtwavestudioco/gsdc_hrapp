import { useState, useEffect, type FC } from 'react';
import HelperToDriverModal, { type HelperToDriverRequest } from '../components/HelperToDriverModal';
import Loading from '../components/Loading';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import '../styles/App.css';
import '../styles/index.css';

const HelperToDriver: FC = () => {
  const [requests, setRequests] = useState<HelperToDriverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<HelperToDriverRequest | null>(null);
  const [theme, setTheme] = useState(localStorage.getItem('hrapp.theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('hrapp.theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${import.meta.env.VITE_API_BASE_URL}/helper-to-driver`;
        const res = await fetch(url, {
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY },
        });
        if (!res.ok) throw new Error('Failed to fetch conversion requests');
        const data = await res.json();
        setRequests(data.map((r: Record<string, unknown>) => ({
          id: r.KAMIId ?? 0,
          helperName: r.FullName ?? '',
          currentAssignment: '',
          status: r.Status ?? '',
          costCenter: r.CostCenter ?? '',
          areaAssignment: r.AreaAssignment ?? '',
          startDate: r.StartDate ?? '',
          completionDate: r.CompletionDate ?? '',
        })));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [modalOpen]);

  const handleAdd = () => {
    setSelectedRequest({ id: 0, helperName: '', currentAssignment: '', status: '', costCenter: '', areaAssignment: '', startDate: '', completionDate: '' });
    setModalOpen(true);
  };
  const handleEdit = (req: HelperToDriverRequest) => {
    setSelectedRequest(req);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
  };
  const handleSave = async (req: HelperToDriverRequest) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      // If file is attached, warn user (backend does not support file upload)
      if (req.conversionAttachment) {
        alert('File upload is not supported by the backend. Please remove the attachment.');
        setLoading(false);
        return;
      }
      const payload = {
        kamiId: req.id,
        fullName: req.helperName,
        status: req.status,
        costCenter: req.costCenter,
        areaAssignment: req.areaAssignment,
        startDate: req.startDate || null,
        completionDate: req.completionDate || null,
      };
      if (req.id && req.id !== 0) {
        // Update existing request
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/helper-to-driver/${req.id}`, {
          method: 'PUT',
          headers: {
            'x-api-key': import.meta.env.VITE_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new request
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/helper-to-driver`, {
          method: 'POST',
          headers: {
            'x-api-key': import.meta.env.VITE_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }
      if (!response.ok) {
        let errorMsg = 'Failed to save conversion request';
        try {
          const errorData = await response.json();
          errorMsg += errorData?.message ? `: ${errorData.message}` : '';
        } catch {
          try {
            const text = await response.text();
            if (text) errorMsg += `: ${text}`;
          } catch {/* ignore */}
        }
        // Log full response for debugging
        console.error('Save error:', response.status, response.statusText, errorMsg);
        throw new Error(errorMsg);
      }
      setModalOpen(false);
      setSelectedRequest(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };



  const handleLogout = () => {
    localStorage.removeItem('hrapp.authenticated');
    window.location.hash = '#/login';
  };

  return (
    <div className="helper2driver-bg">
      <TopBar theme={theme} setTheme={setTheme} handleLogout={handleLogout} />
      {/* Content Row: Sidebar + Main Content */}
      <div className="helper2driver-content-row">
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content */}
        <main className="helper2driver-main">
          <h2 className="helper2driver-title">Helper to Driver</h2>
          <div className="helper2driver-header-row">
            <button className="sidebar-btn helper2driver-btn helper2driver-btn-wide" onClick={() => window.location.hash = '#/'}>Back to Dashboard</button>
            <button className="sidebar-btn helper2driver-btn helper2driver-btn-wide" onClick={handleAdd}>Register Helper</button>
          </div>
          <div className="helper2driver-table-card">
            <h3 className="helper2driver-table-title">Helper-to-Driver Conversion Requests</h3>
            <div className="helper2driver-table-wrapper">
              {loading && <Loading message="Loading conversions..." />}
              {error && <p className="helper2driver-error">Error: {error}</p>}
              {!loading && !error && (
                <table className="helper2driver-table">
                  <thead>
                    <tr>
                      <th>Helper Name</th>
                      <th>Cost Center</th>
                      <th>Area Assignment</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>Completion Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr><td colSpan={7} className="helper2driver-table-empty">No conversion requests found.</td></tr>
                    ) : (
                      requests.map(req => (
                        <tr key={req.id}>
                          <td>{req.helperName}</td>
                          <td>{req.costCenter}</td>
                          <td>{req.areaAssignment}</td>
                          <td>{req.status}</td>
                          <td>{req.startDate ? new Date(req.startDate).toLocaleDateString() : ''}</td>
                          <td>{req.completionDate ? new Date(req.completionDate).toLocaleDateString() : ''}</td>
                          <td><button className="sidebar-btn modal-action-save" onClick={() => handleEdit(req)}>Edit</button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <HelperToDriverModal
            request={selectedRequest}
            open={modalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
          />
        </main>
      </div>
    </div>
  );
};

export default HelperToDriver;
