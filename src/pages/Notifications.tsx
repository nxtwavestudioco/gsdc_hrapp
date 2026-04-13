import React, { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import Loading from '../components/Loading';
import '../styles/App.css';
import '../styles/index.css';

interface DriverExpiry {
  id?: number;
  fullName: string;
  licenseNumber?: string;
  licenseExpiry?: string; // ISO date
  daysLeft?: number;
}

const Notifications: React.FC = () => {
  const [data, setData] = useState<DriverExpiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState(localStorage.getItem('hrapp.theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('hrapp.theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      const apiKey = import.meta.env.VITE_API_KEY;
      if (!apiBase) {
        setError('No API base configured');
        setLoading(false);
        return;
      }
      const endpoints = [
        '/notifications/drivers-license-expiry',
        '/drivers/expiring',
        '/drivers/license-expiry',
      ];
      try {
        let success = false;
        for (const ep of endpoints) {
          try {
            const url = `${apiBase}${ep}?days=30`;
            const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
            if (!res.ok) continue;
            const body = await res.json();
            // Normalize response to array of DriverExpiry
            let items: DriverExpiry[] = [];
            if (Array.isArray(body)) {
              const toDriver = (it: Record<string, unknown>): DriverExpiry => {
                const r = it as Record<string, unknown>;
                const getStr = (k: string) => (typeof r[k] === 'string' ? (r[k] as string) : '');
                const idVal = typeof r['id'] === 'number' ? (r['id'] as number) : (typeof r['DriverId'] === 'number' ? (r['DriverId'] as number) : undefined);
                const last = getStr('LastName') || getStr('lastName');
                const first = getStr('FirstName') || getStr('firstName');
                return {
                  id: idVal,
                  fullName: `${last}${last && first ? ', ' : ''}${first}`.trim(),
                  licenseNumber: getStr('LicenseNumber') || getStr('licenseNumber'),
                  licenseExpiry: getStr('LicenseExpiry') || getStr('licenseExpiry') || getStr('ExpiryDate') || getStr('expiryDate'),
                  daysLeft: typeof r['daysLeft'] === 'number' ? (r['daysLeft'] as number) : undefined,
                };
              };
              items = body.map((it: Record<string, unknown>) => toDriver(it));
            } else if (body && typeof body === 'object') {
              // maybe { count, items: [...] }
              const arr = body.items || body.data || [];
              if (Array.isArray(arr)) {
                const toDriver = (it: Record<string, unknown>): DriverExpiry => {
                  const r = it as Record<string, unknown>;
                  const getStr = (k: string) => (typeof r[k] === 'string' ? (r[k] as string) : '');
                  const idVal = typeof r['id'] === 'number' ? (r['id'] as number) : (typeof r['DriverId'] === 'number' ? (r['DriverId'] as number) : undefined);
                  const last = getStr('LastName') || getStr('lastName');
                  const first = getStr('FirstName') || getStr('firstName');
                  return {
                    id: idVal,
                    fullName: `${last}${last && first ? ', ' : ''}${first}`.trim(),
                    licenseNumber: getStr('LicenseNumber') || getStr('licenseNumber'),
                    licenseExpiry: getStr('LicenseExpiry') || getStr('licenseExpiry') || getStr('ExpiryDate') || getStr('expiryDate'),
                    daysLeft: typeof r['daysLeft'] === 'number' ? (r['daysLeft'] as number) : undefined,
                  };
                };
                items = arr.map((it: Record<string, unknown>) => toDriver(it));
              }
            }
            setData(items);
            success = true;
            break;
          } catch {
            // try next endpoint
          }
        }
        if (!success) setError('No notification endpoint available or returned no data');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="recruitment-bg">
      <TopBar theme={theme} setTheme={setTheme} handleLogout={() => { localStorage.removeItem('hrapp.authenticated'); window.location.hash = '#/login'; }} />
      <div className="recruitment-content-row">
        <Sidebar />
        <main className="recruitment-main">
          <h2 className="recruitment-title">Notifications — Drivers Near License Expiry</h2>
          {loading && <Loading message="Loading notifications..." />}
          {error && <p className="recruitment-error">Error: {error}</p>}
          {!loading && !error && (
            <div className="recruitment-table-card">
              <div className="recruitment-table-wrapper">
                <table className="recruitment-table">
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>License No.</th>
                      <th>Expiry Date</th>
                      <th>Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr><td colSpan={4} className="recruitment-table-empty">No drivers nearing expiry.</td></tr>
                    ) : (
                      data.map(d => (
                        <tr key={d.id || d.licenseNumber || d.fullName}>
                          <td>{d.fullName}</td>
                          <td>{d.licenseNumber}</td>
                          <td>{d.licenseExpiry ? (new Date(d.licenseExpiry)).toLocaleDateString() : ''}</td>
                          <td>{typeof d.daysLeft === 'number' ? d.daysLeft : ''}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Notifications;
