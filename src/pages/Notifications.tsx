import { useEffect, useState, type FC } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import { Download } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';
import Loading from '../components/Loading';
import '../styles/App.css';
import '../styles/index.css';

interface DriverExpiry {
  id?: number;
  fullName: string;
  licenseNumber?: string;
  licenseExpiry?: string; // ISO date
  daysLeft?: number;
  bu?: string;
  assignment?: string;
}

const Notifications: FC = () => {
  const [data, setData] = useState<DriverExpiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [theme, setTheme] = useState(localStorage.getItem('hrapp.theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('hrapp.theme', theme);
  }, [theme]);

  const { expiringDrivers } = useNotifications();
  // normalize incoming records to DriverExpiry shape (handles many API / context key variants)
  const normalize = (r: Record<string, unknown>): DriverExpiry => {
    const getStr = (k: string) => {
      const v = r[k as keyof Record<string, unknown>];
      if (typeof v === 'string') return v as string;
      if (typeof v === 'number') return String(v);
      return '';
    };
    const id = typeof r['id'] === 'number' ? (r['id'] as number) : (typeof r['DriverId'] === 'number' ? (r['DriverId'] as number) : (typeof r['KAMIId'] === 'number' ? (r['KAMIId'] as number) : undefined));
    const fullName = getStr('fullName') || getStr('FullName') || getStr('name') || (() => { const last = getStr('LastName') || getStr('lastName'); const first = getStr('FirstName') || getStr('firstName'); return `${last}${last && first ? ', ' : ''}${first}`.trim(); })();
    let licenseNumber = getStr('licenseNumber') || getStr('LicenseNumber') || getStr('LicenseNo') || getStr('License_No') || getStr('DriversLicense') || getStr('driversLicense') || getStr('Drivers_License') || getStr('DriversLicenseNo') || getStr('drivers_license_no') || getStr('DriversLicenseNumber') || '';
    // Fallback: scan keys for any license-like field (but skip expiry fields)
    if (!licenseNumber) {
      for (const k of Object.keys(r)) {
        const lk = k.toLowerCase();
        if (lk.includes('license') && !lk.includes('expir') && !lk.includes('expiry')) {
          const v = r[k as keyof typeof r];
          if (typeof v === 'string') { licenseNumber = v; break; }
          if (typeof v === 'number') { licenseNumber = String(v); break; }
        }
        // also accept keys like 'licno' or 'licence'
        if ((lk.includes('lic') || lk.includes('licence') || lk.includes('licno')) && !lk.includes('expir')) {
          const v = r[k as keyof typeof r];
          if (typeof v === 'string') { licenseNumber = v; break; }
          if (typeof v === 'number') { licenseNumber = String(v); break; }
        }
      }
    }
    const licenseExpiryRaw = getStr('licenseExpiry') || getStr('LicenseExpiry') || getStr('expiryDate') || getStr('ExpiryDate') || getStr('DriversLicenseExpiryDate') || getStr('driversLicenseExpiryDate') || '';
    const licenseExpiry = licenseExpiryRaw ? String(new Date(licenseExpiryRaw).toISOString()) : undefined;
    const daysLeftVal = typeof r['daysLeft'] === 'number' ? (r['daysLeft'] as number) : undefined;
    const computedDays = (typeof daysLeftVal === 'number') ? daysLeftVal : (licenseExpiry ? Math.ceil((new Date(String(licenseExpiry)).getTime() - new Date().getTime())/(1000*60*60*24)) : undefined);
    const bu = getStr('bu') || getStr('BU') || getStr('business_unit') || getStr('BusinessUnit') || getStr('BUName') || getStr('CostCenter') || getStr('costCenter') || getStr('Branch') || getStr('Office') || '';
    const assignment = getStr('assignment') || getStr('Assignment') || getStr('position') || getStr('Position') || getStr('AreaAssignment') || getStr('AssignmentArea') || getStr('areaAssignment') || '';
    return { id, fullName: fullName || '', licenseNumber: licenseNumber || undefined, licenseExpiry, daysLeft: computedDays, bu: bu || undefined, assignment: assignment || undefined };
  };
  useEffect(() => {
    // If Home has provided expiring drivers, use that list directly
    if (expiringDrivers !== null) {
      const mapped = (expiringDrivers || []).map(d => normalize(d as Record<string, unknown>));
      mapped.sort((a,b) => (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9));
      setData(mapped.map(m => ({ ...m })));
      setLoading(false);
      setError(null);
      return;
    }
    // Fallback: if context did not provide data, keep existing API fetch behavior
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
        // Try employees endpoint first to derive expiries locally (fewer 404s on hosts without notification endpoints)
        try {
          const resp = await fetch(`${apiBase}/employees`, { headers: { 'x-api-key': apiKey } });
          if (resp.ok) {
            const list = await resp.json();
            if (Array.isArray(list)) {
              const pairs = list.map((it: Record<string, unknown>) => ({ raw: it, norm: normalize(it) }));
              const derived = pairs
                .filter(({ raw, norm }) => {
                  const pos = (raw['position'] || raw['Position'] || raw['PositionGroup'] || raw['positionGroup'] || norm.assignment || '').toString();
                  return /driver/i.test(pos) && typeof norm.daysLeft === 'number' && norm.daysLeft >= 0 && norm.daysLeft <= 30;
                })
                .map(p => p.norm);
              derived.sort((a,b) => (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9));
              setData(derived);
              success = true;
            }
          }
        } catch {
          // ignore employees failure and fall back to notification endpoints
        }
        for (const ep of endpoints) {
          try {
            const url = `${apiBase}${ep}?days=30`;
            const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
            if (!res.ok) continue;
            const body = await res.json();
            // Normalize response to array of DriverExpiry
            let items: DriverExpiry[] = [];
            if (Array.isArray(body)) {
              items = body.map((it: Record<string, unknown>) => normalize(it));
            } else if (body && typeof body === 'object') {
              // maybe { count, items: [...] }
              const arr = body.items || body.data || body.drivers || [];
              if (Array.isArray(arr)) {
                items = arr.map((it: Record<string, unknown>) => normalize(it));
              }
            }
            items.sort((a,b) => (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9));
            setData(items as DriverExpiry[]);
            success = true;
            break;
          } catch {
            // try next endpoint
          }
        }
        if (!success) setError('No notification endpoint available or returned no data');
        // Additional fallback: try /employees to derive expiring drivers locally
        if (!success) {
          setError('No notification endpoint available or returned no data');
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [expiringDrivers]);

  // Search + pagination derived values
  const pageSize = 10;
  const filteredData = data.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.fullName || '').toLowerCase().includes(q) ||
      (d.bu || '').toLowerCase().includes(q) ||
      (d.assignment || '').toLowerCase().includes(q) ||
      (d.licenseNumber || '').toLowerCase().includes(q) ||
      (d.licenseExpiry || '').toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pageData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  // CSV export of current filtered view
  const exportCsv = () => {
    const rows = [
      ['Driver', 'Cost Center', 'Area Assignment', 'License No.', 'Expiry Date', 'Days Left']
    ];
    for (const d of filteredData) {
      rows.push([
        d.fullName || '',
        d.bu || '',
        d.assignment || '',
        d.licenseNumber || '',
        d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : '',
        typeof d.daysLeft === 'number' ? String(d.daysLeft) : ''
      ]);
    }
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drivers-expiry-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              <div className="search-wrapper">
                <input className="search-input" placeholder="Search driver, Cost Center, Area Assignment, license..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                <div className="notif-controls">
                  <button aria-label="Download CSV" title="Download CSV" onClick={exportCsv} className="csv-download-btn">
                    <Download size={18} color="#1e293b" />
                  </button>
                </div>
              </div>
              <div className="recruitment-table-wrapper">
                <table className="recruitment-table">
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Cost Center</th>
                      <th>Area Assignment</th>
                      <th>License No.</th>
                      <th>Expiry Date</th>
                      <th>Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr><td colSpan={6} className="recruitment-table-empty">No drivers nearing expiry.</td></tr>
                    ) : (
                      pageData.map(d => {
                        const days = typeof d.daysLeft === 'number' ? d.daysLeft : (d.licenseExpiry ? Math.ceil((new Date(d.licenseExpiry!).getTime() - new Date().getTime())/(1000*60*60*24)) : undefined);
                        const urgent = typeof days === 'number' && days <= 7;
                        return (
                          <tr key={d.id || d.licenseNumber || d.fullName} className={urgent ? 'urgent-row' : ''}>
                            <td className="driver-name">{d.fullName}</td>
                            <td>{d.bu || ''}</td>
                            <td>{d.assignment || ''}</td>
                            <td>{d.licenseNumber}</td>
                            <td>{d.licenseExpiry ? (new Date(d.licenseExpiry)).toLocaleDateString() : ''}</td>
                            <td>{typeof days === 'number' ? days : ''}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {filteredData.length > pageSize && (
                <div className="notif-pagination">
                  <div className="notif-pagination-info">Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredData.length)} of {filteredData.length}</div>
                  <div className="notif-pagination-buttons">
                    <button className="sidebar-btn small-pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                    <div className="notif-page-indicator">{page} / {totalPages}</div>
                    <button className="sidebar-btn small-pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Notifications;
