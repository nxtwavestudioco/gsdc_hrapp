
import '../styles/App.css';
import '../styles/index.css';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import Loading from '../components/Loading';
import { useNotifications } from '../contexts/NotificationsContext';
import { createPortal } from 'react-dom';
import styles from '../styles/HomeStyles.module.css';
import { UserCheck, Users, UserX, Clock, CalendarCheck } from 'lucide-react';

// Reusable KPI Card component — card itself is not clickable; breakdown items handle clicks
function KpiCard({ color, icon, label, count, breakdown }: {
  color: 'blue' | 'green' | 'red' | 'yellow',
  icon: React.ReactNode,
  label: string,
  count: number,
  breakdown: React.ReactNode,
}) {
  return (
    <div
      className={[
        styles.kpiCard,
        color === 'blue' && styles.cardBlue,
        color === 'green' && styles.cardGreen,
        color === 'red' && styles.cardRed,
        color === 'yellow' && styles.cardYellow
      ].filter(Boolean).join(' ')}
      aria-label={label}
    >
      <div className={styles.cardIcon}>{icon}</div>
      <div className={styles.statTitleBig}>{label}</div>
      <div className={[
        styles.statNumberBig,
        label === 'Active' && styles.statNumberActive,
        label === 'Inactive' && styles.statNumberInactive,
        label === 'On Leave' && styles.statNumberOnLeave
      ].filter(Boolean).join(' ')}>{count}</div>
      <div className={styles.kpiBreakdown}>{breakdown}</div>
    </div>
  );
}

// Modal state and reusable modal component
type Employee = {
  name: string;
  bu?: string;
  assignment?: string;
  dateHired?: string;
  status?: string;
  position?: string;
  count?: number | string;
};

type ModalState = {
  open: boolean;
  title: string;
  employees: Employee[];
  search?: string;
};

// Generic KPI list modal used by the new KPIs
function KPIListModal({ open, title, columns, rows, onClose }: { open: boolean; title: string; columns: { key: string; label: string }[]; rows: Record<string, unknown>[]; onClose: () => void }) {
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => setSearch(''), 0);
    return () => clearTimeout(id);
  }, [open]);
  useEffect(() => {
    const prev = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (open && typeof document !== 'undefined') document.body.style.overflow = 'hidden';
    return () => { if (typeof document !== 'undefined') document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(r).some(v => (v||'').toString().toLowerCase().includes(q));
  });
  const modalContent = (
    <div className="modal-overlay" tabIndex={-1} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header-fixed">
          <div className={styles.modalHeaderRow}>
            <span className={styles.modalTitle}>{title}</span>
            <button className={styles.modalClose} onClick={onClose} aria-label="Close">×</button>
          </div>
          <div className={styles.modalSearchWrap}>
            <input className={styles.modalSearch} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className={styles.modalTableWrap}>
          <table className={styles.modalTable}>
            <thead>
              <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={columns.length} className={styles.modalTableEmpty}>No results.</td></tr> : (
                filtered.map((r, i) => (
                  <tr key={i}>{columns.map(c => {
                    const val = r[c.key];
                    return <td key={c.key}>{String(val ?? '')}</td>;
                  })}</tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  return createPortal(modalContent, document.body);
}

// Simple horizontal bar chart component (pure CSS) for KPI visualization
// (Removed larger BarChart; keep compact Mini below)

// Compact variant for small cards
function BarChartMini({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className={`${styles.barChart} ${styles.barChartSmall}`} role="img" aria-label="KPI mini bar chart">
      {data.map(d => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div key={d.label} className={`${styles.barRow} ${styles.barRowSmall}`}>
            <div className={`${styles.barLabel} ${styles.barLabelSmall}`}>{d.label}</div>
            <div className={styles.barTrack}>
              <svg viewBox="0 0 100 8" preserveAspectRatio="none" width="100%" height="8" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="0" y="0" width={`${pct}`} height="8" fill={d.color || '#2563eb'} />
              </svg>
            </div>
            <div className={`${styles.barValue} ${styles.barValueSmall}`}>{d.value}</div>
          </div>
        );
      })}
    </div>
  );
}

function EmployeeModal({ open, title, employees, onClose }: { open: boolean; title: string; employees: Employee[]; onClose: () => void }) {
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (open) {
      // reset search when modal opens
      const id = setTimeout(() => setSearch(''), 0);
      return () => clearTimeout(id);
    }
  }, [open]);
  // Prevent body scrolling while modal is open and restore on close
  useEffect(() => {
    const prev = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (open && typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (typeof document !== 'undefined') document.body.style.overflow = prev;
    };
  }, [open]);
  const filtered = employees.filter(e =>
    (e.name && e.name.toLowerCase().includes(search.toLowerCase())) ||
    (e.bu && e.bu.toLowerCase().includes(search.toLowerCase())) ||
    (e.assignment && e.assignment.toLowerCase().includes(search.toLowerCase()))
  );
  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const modalContent = (
    <div
      className="modal-overlay"
      tabIndex={-1}
      onClick={onClose}
    >
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header-fixed">
          <div className={styles.modalHeaderRow}>
            <span className={styles.modalTitle}>{title}</span>
            <button className={styles.modalClose} onClick={onClose} aria-label="Close">×</button>
          </div>
          <div className={styles.modalSearchWrap}>
            <input
              className={styles.modalSearch}
              placeholder="Search BU or count..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className={styles.modalTableWrap}>
          <table className={styles.modalTable}>
            <thead>
              <tr>
                <th>BU</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={2} className={styles.modalTableEmpty}>No results.</td></tr>
              ) : (() => {
                // Normalize BU display (remove BO- and BD-BU prefixes)
                const normalizeBU = (raw?: string) => {
                  if (!raw) return '';
                  return raw.replace(/^\s*(?:BO-|BD-BU\s*|BD-|BDBU-|BD_BU_|BDBU-|BD-BU-)/i, '').trim();
                };

                // Group definitions (order matters). Use pattern matching so variants like SBUO-2A also map correctly.
                const groupMatchers: Array<{ name: string; match: (nb: string) => boolean }> = [
                  { name: 'LUZON CEMENT OPERATION', match: nb => nb.startsWith('SBUO-') || nb.includes('CEMENT') },
                  { name: 'CARGO OPERATION', match: nb => nb.includes('CARGO') || nb === 'GS ZION' || nb === 'JESI' },
                  { name: 'PORT OPERATION', match: nb => nb === 'PORT' || nb.includes('PORT') },
                  { name: 'VISMIN OPERATION', match: nb => ['DAVAO','LUGAIT','CEBU'].includes(nb) },
                  { name: 'CAR CARRIER', match: nb => nb.includes('CAR CARRIER') || nb === 'CAR CARRIER' }
                ];

                // Build map of normalized BU -> count
                const buMap = new Map<string, number>();
                const originalMap = new Map<string, string>();
                for (const item of filtered) {
                  const raw = (item.bu || item.name || '').toString();
                  const nb = normalizeBU(raw).toUpperCase();
                  const count = Number(item.count ?? 0);
                  buMap.set(nb, (buMap.get(nb) || 0) + count);
                  // keep a display-friendly original (first seen)
                  if (!originalMap.has(nb)) originalMap.set(nb, normalizeBU(raw));
                }

                // Assign BUs to groups using matchers
                const grouped: Record<string, { bu: string; count: number }[]> = {};
                const groupTotals: Record<string, number> = {};
                // initialize groups
                for (const gm of groupMatchers) { grouped[gm.name] = []; groupTotals[gm.name] = 0; }
                const others: { bu: string; count: number }[] = [];

                for (const [nb, count] of buMap.entries()) {
                  const display = originalMap.get(nb) || nb;
                  let matched = false;
                  for (const gm of groupMatchers) {
                    if (gm.match(nb)) {
                      grouped[gm.name].push({ bu: display, count });
                      groupTotals[gm.name] = (groupTotals[gm.name] || 0) + count;
                      matched = true;
                      break;
                    }
                  }
                  if (!matched) others.push({ bu: display, count });
                }

                // Sort entries in each group for consistent display
                for (const gName of Object.keys(grouped)) {
                  grouped[gName].sort((a,b) => a.bu.localeCompare(b.bu));
                }
                others.sort((a,b) => a.bu.localeCompare(b.bu));

                // Render grouped sections in order
                const rows: ReactNode[] = [];
                for (const gm of groupMatchers) {
                  const g = gm.name;
                  if (grouped[g].length === 0) continue;
                  rows.push(
                    <tr key={`grp-${g}`} className={styles.modalGroupHeader} data-role="group-header"><td colSpan={2}>{g}</td></tr>
                  );
                  for (const entry of grouped[g]) {
                    rows.push(<tr key={`${g}-${entry.bu}`}><td>{entry.bu}</td><td>{entry.count}</td></tr>);
                  }
                  rows.push(<tr key={`subtotal-${g}`} className={styles.modalGroupSubtotal} data-role="group-subtotal"><td className={styles.modalTfootCell}>Total</td><td className={styles.modalTfootCell}>{groupTotals[g]}</td></tr>);
                }

                if (others.length > 0) {
                  rows.push(<tr key={`grp-OTHERS`} className={styles.modalGroupHeader} data-role="group-header"><td colSpan={2}>OTHERS</td></tr>);
                  for (const entry of others) rows.push(<tr key={`oth-${entry.bu}`}><td>{entry.bu}</td><td>{entry.count}</td></tr>);
                  rows.push(<tr key={`subtotal-OTHERS`} className={styles.modalGroupSubtotal} data-role="group-subtotal"><td className={styles.modalTfootCell}>Total</td><td className={styles.modalTfootCell}>{others.reduce((a,r)=>a+r.count,0)}</td></tr>);
                }

                return rows;
              })()}
            </tbody>
            <tfoot>
              <tr>
                <td className={styles.modalTfootCell}>Grand Total</td>
                <td className={styles.modalTfootCell}>{Array.from(new Map(filtered.map(i => [ (i.bu||i.name||'').toString().replace(/^\s*(?:BO-|BD-BU\s*|BD-|BDBU-|BD_BU_|BDBU-|BD-BU-)/i,'').trim().toUpperCase(), Number(i.count ?? 0) ]))).reduce((a,[,v])=>a+v,0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );

  // Mount modal at the top-level body to avoid container clipping/overflow issues
  console.debug('Opening dashboard modal:', title, 'items:', employees.length);
  console.debug('HomeStyles.modalOverlay class:', styles.modalOverlay, 'modalCard class:', styles.modalCard);
  if (typeof document !== 'undefined') {
    console.debug('document.body exists, nodeName=', document.body && document.body.nodeName);
  }
  return createPortal(modalContent, document.body);
}
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';


type DashboardRow = {
  BU: string;
  PositionGroup: string;
  TotalCount: number;
  DeployedCount: number;
  ApprenticeCount: number;
  UndeployedCount: number;
  ActiveCount: number;
  OnLeaveCount: number;
  InactiveCount: number;
};




function Home() {
  // Modal state for KPI cards
  const [modal, setModal] = useState<ModalState | null>(null);
  const [data, setData] = useState<DashboardRow[]>([]);
  const [employeesFull, setEmployeesFull] = useState<Record<string, unknown>[]>([]);
  const [kpiModal, setKpiModal] = useState<{ open: boolean; title: string; rows: Record<string, unknown>[] } | null>(null);
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
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard/summary`, {
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY },
        });
        if (!res.ok) throw new Error('Failed to fetch dashboard summary');
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // fetch full employees for tenure/license KPIs
    (async function fetchEmployees(){
      try{
        const r = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employees`, { headers: { 'x-api-key': import.meta.env.VITE_API_KEY } });
        if (!r.ok) return;
        const list = await r.json();
        setEmployeesFull(list);
      }catch(e){ console.debug('employees fetch failed', e); }
    })();
  }, []);

  // Update notifications count from employeesFull (drivers with license expiry within X days)
  const { setExpiringDriversCount, setExpiringDrivers } = useNotifications();
  useEffect(() => {
    if (!employeesFull || employeesFull.length === 0) {
      setExpiringDriversCount(0);
      setExpiringDrivers([]);
      return;
    }
    const daysWindow = 30; // default window; can be parameterized later
    const now = new Date();
    let count = 0;
    const list: Record<string, unknown>[] = [];
    for (const e of employeesFull) {
      const rec = e as Record<string, unknown>;
      const pos = (rec['Position'] || rec['position'] || rec['PositionGroup'] || rec['positionGroup'] || '') as string;
      if (!pos || !/driver/i.test(pos)) continue;
      const getStr = (k: string) => {
        const v = rec[k];
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return String(v);
        return '';
      };
      const expiryStr = getStr('LicenseExpiry') || getStr('licenseExpiry') || getStr('ExpiryDate') || getStr('expiryDate') || getStr('LicenseExpiration') || getStr('licenseExpiration') || getStr('DriversLicenseExpiryDate') || getStr('driversLicenseExpiryDate') || getStr('licenseExpiry') || '';
      if (!expiryStr) continue;
      const d = new Date(expiryStr);
      if (isNaN(d.getTime())) continue;
      const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= daysWindow) {
        count += 1;
        const getName = () => {
          const fn = getStr('FullName') || getStr('fullName') || getStr('name') || '';
          if (fn) return fn;
          const last = getStr('LastName') || getStr('lastName') || '';
          const first = getStr('FirstName') || getStr('firstName') || '';
          return `${last}${last && first ? ', ' : ''}${first}`.trim() || '';
        };
        let licenseNo = getStr('LicenseNumber') || getStr('licenseNumber') || getStr('LicenseNo') || getStr('license_no') || getStr('DriversLicense') || getStr('driversLicense') || getStr('Drivers_License') || getStr('DriversLicenseNo') || getStr('drivers_license_no') || getStr('DriversLicenseNumber') || '';
        if (!licenseNo) {
          // scan for license-like keys
          for (const k of Object.keys(rec)) {
            const lk = k.toLowerCase();
            if (lk.includes('license') && !lk.includes('expir') && !lk.includes('expiry')) {
              const v = rec[k];
              if (typeof v === 'string') { licenseNo = v; break; }
              if (typeof v === 'number') { licenseNo = String(v); break; }
            }
            if ((lk.includes('lic') || lk.includes('licence') || lk.includes('licno')) && !lk.includes('expir')) {
              const v = rec[k];
              if (typeof v === 'string') { licenseNo = v; break; }
              if (typeof v === 'number') { licenseNo = String(v); break; }
            }
          }
        }
        const buVal = getStr('BU') || getStr('bu') || getStr('business_unit') || getStr('BusinessUnit') || getStr('BUName') || getStr('Branch') || getStr('Office') || '';
        const assignmentVal = getStr('assignment') || getStr('Assignment') || getStr('Position') || getStr('position') || getStr('AreaAssignment') || getStr('AssignmentArea') || '';
        list.push({ fullName: getName(), licenseNumber: licenseNo, licenseExpiry: d.toISOString(), daysLeft: diffDays, bu: buVal, assignment: assignmentVal });
      }
    }
    setExpiringDriversCount(count);
    setExpiringDrivers(list);
  }, [employeesFull, setExpiringDriversCount, setExpiringDrivers]);

  // KPI breakdowns
  const totalEmployees = data.reduce((a, r) => a + (r.TotalCount || 0), 0);
  const totalActive = data.reduce((a, r) => a + (r.ActiveCount || 0), 0);
  const totalInactive = data.reduce((a, r) => a + (r.InactiveCount || 0), 0);
  const totalOnLeave = data.reduce((a, r) => a + (r.OnLeaveCount || 0), 0);
  const driverActive = data.filter(r => r.PositionGroup === 'DRIVER').reduce((a, r) => a + (r.ActiveCount || 0), 0);
  const helperActive = data.filter(r => r.PositionGroup === 'HELPER').reduce((a, r) => a + (r.ActiveCount || 0), 0);
  const driverInactive = data.filter(r => r.PositionGroup === 'DRIVER').reduce((a, r) => a + (r.InactiveCount || 0), 0);
  const helperInactive = data.filter(r => r.PositionGroup === 'HELPER').reduce((a, r) => a + (r.InactiveCount || 0), 0);
  const driverOnLeave = data.filter(r => r.PositionGroup === 'DRIVER').reduce((a, r) => a + (r.OnLeaveCount || 0), 0);
  const helperOnLeave = data.filter(r => r.PositionGroup === 'HELPER').reduce((a, r) => a + (r.OnLeaveCount || 0), 0);
  const unassignedTotal = data.filter(r => r.PositionGroup === 'OTHERS').reduce((a, r) => a + (r.TotalCount || 0), 0);

  // Pie chart data for status

  // Bar chart data for BU/PositionGroup

  // Table data

  const handleLogout = () => {
    localStorage.removeItem('hrapp.authenticated');
    window.location.hash = '#/login';
  };

  return (
    <div className={styles.dashboardContainer}>
      <TopBar theme={theme} setTheme={setTheme} handleLogout={handleLogout} />
      <div className={styles.dashboardFlexRow}>
        <Sidebar />
        <div className={styles.dashboardMainContent}>
          <main className="dashboard-main">
            <h1 className={styles.dashboardTitleCentered}>Employee Analytics Dashboard</h1>
            {loading && <Loading message="Loading dashboard..." />}
            {error && <div className={styles.dashboardError}>{error}</div>}
            {!loading && !error && (
              <>
                {/* KPI Summary Cards */}
                <div className={styles.kpiGrid}>
                  <KpiCard
                    color="blue"
                    icon={<Users size={32} color="#2563eb" />}
                    label="Total Employees"
                    count={totalEmployees}
                    breakdown={<>
                      <span className={styles.kpiBreakdownClickable} onClick={e => {
                        e.stopPropagation();
                        console.log('KPI click: opening Driver Count per BU');
                        setModal({
                          open: true,
                          title: 'Driver Count per BU',
                          employees: data.filter(r => r.PositionGroup === 'DRIVER' && (r.TotalCount || 0) > 0).map(r => ({
                            name: r.BU,
                            bu: r.BU,
                            assignment: r.PositionGroup,
                            count: r.TotalCount || 0,
                            dateHired: '',
                            status: '',
                            position: r.PositionGroup
                          }))
                        });
                      }}>Driver: {driverActive + driverInactive + driverOnLeave}</span>
                      {' | '}
                      <span className={styles.kpiBreakdownClickable} onClick={e => {
                        e.stopPropagation();
                        console.log('KPI click: opening Helper Count per BU');
                        setModal({
                          open: true,
                          title: 'Helper Count per BU',
                          employees: data.filter(r => r.PositionGroup === 'HELPER' && (r.TotalCount || 0) > 0).map(r => ({
                            name: r.BU,
                            bu: r.BU,
                            assignment: r.PositionGroup,
                            count: r.TotalCount || 0,
                            dateHired: '',
                            status: '',
                            position: r.PositionGroup
                          }))
                        });
                      }}>Helper: {helperActive + helperInactive + helperOnLeave}</span>
                      {' | '}
                      <span className={styles.kpiBreakdownClickable} onClick={e => {
                        e.stopPropagation();
                        console.log('KPI click: opening Unassigned Positions per BU');
                        setModal({
                          open: true,
                          title: 'Unassigned Positions per BU',
                          employees: data.filter(r => r.PositionGroup === 'OTHERS' && (r.TotalCount || 0) > 0).map(r => ({
                            name: r.BU,
                            bu: r.BU,
                            assignment: r.PositionGroup,
                            count: r.TotalCount || 0,
                            dateHired: '',
                            status: '',
                            position: r.PositionGroup
                          }))
                        });
                      }}>Unassigned: {unassignedTotal}</span>
                    </>}
                    
                  />
                  <KpiCard
                    color="green"
                    icon={<UserCheck size={32} color="#22c55e" />}
                    label="Active"
                    count={totalActive}
                    breakdown={<>
                      <span className={styles.kpiBreakdownClickable} onClick={e => {
                        e.stopPropagation();
                        console.log('KPI click: opening Active Drivers per BU');
                        setModal({
                          open: true,
                          title: 'Active Drivers per BU',
                          employees: data.filter(r => r.PositionGroup === 'DRIVER' && (r.ActiveCount || 0) > 0).map(r => ({
                            name: r.BU,
                            bu: r.BU,
                            assignment: r.PositionGroup,
                            count: r.ActiveCount || 0,
                            dateHired: '',
                            status: 'Active',
                            position: r.PositionGroup
                          }))
                        });
                      }}>Driver: {driverActive}</span>
                      {' | '}
                      <span className={styles.kpiBreakdownClickable} onClick={e => {
                        e.stopPropagation();
                        console.log('KPI click: opening Active Helpers per BU');
                        setModal({
                          open: true,
                          title: 'Active Helpers per BU',
                          employees: data.filter(r => r.PositionGroup === 'HELPER' && (r.ActiveCount || 0) > 0).map(r => ({
                            name: r.BU,
                            bu: r.BU,
                            assignment: r.PositionGroup,
                            count: r.ActiveCount || 0,
                            dateHired: '',
                            status: 'Active',
                            position: r.PositionGroup
                          }))
                        });
                      }}>Helper: {helperActive}</span>
                    </>}
                    
                  />
                  <KpiCard
                    color="red"
                    icon={<UserX size={32} color="#ef4444" />}
                    label="Inactive"
                    count={totalInactive}
                    breakdown={<>
                      <span className={styles.kpiBreakdownClickable} onClick={e => {
                        e.stopPropagation();
                        console.log('KPI click: opening Inactive Drivers per BU');
                        setModal({
                          open: true,
                          title: 'Inactive Drivers per BU',
                          employees: data.filter(r => r.PositionGroup === 'DRIVER' && (r.InactiveCount || 0) > 0).map(r => ({
                            name: r.BU,
                            bu: r.BU,
                            assignment: r.PositionGroup,
                            count: r.InactiveCount || 0,
                            dateHired: '',
                            status: 'Inactive',
                            position: r.PositionGroup
                          }))
                        });
                      }}>Driver: {driverInactive}</span>
                      {' | '}
                      <span className={styles.kpiBreakdownClickable} onClick={e => {
                        e.stopPropagation();
                        console.log('KPI click: opening Inactive Helpers per BU');
                        setModal({
                          open: true,
                          title: 'Inactive Helpers per BU',
                          employees: data.filter(r => r.PositionGroup === 'HELPER' && (r.InactiveCount || 0) > 0).map(r => ({
                            name: r.BU,
                            bu: r.BU,
                            assignment: r.PositionGroup,
                            count: r.InactiveCount || 0,
                            dateHired: '',
                            status: 'Inactive',
                            position: r.PositionGroup
                          }))
                        });
                      }}>Helper: {helperInactive}</span>
                    </>}
                    
                  />
                  <KpiCard
                    color="yellow"
                    icon={<Clock size={32} color="#facc15" />}
                    label="On Leave"
                    count={totalOnLeave}
                    breakdown={<>
                      <span className={styles.kpiBreakdownClickable} onClick={e => {
                        e.stopPropagation();
                        console.log('KPI click: opening On Leave Drivers per BU');
                        setModal({
                          open: true,
                          title: 'On Leave Drivers per BU',
                          employees: data.filter(r => r.PositionGroup === 'DRIVER' && (r.OnLeaveCount || 0) > 0).map(r => ({
                            name: r.BU,
                            bu: r.BU,
                            assignment: r.PositionGroup,
                            count: r.OnLeaveCount || 0,
                            dateHired: '',
                            status: 'On Leave',
                            position: r.PositionGroup
                          }))
                        });
                      }}>Driver: {driverOnLeave}</span>
                      {' | '}
                      <span className={styles.kpiBreakdownClickable} onClick={e => {
                        e.stopPropagation();
                        console.log('KPI click: opening On Leave Helpers per BU');
                        setModal({
                          open: true,
                          title: 'On Leave Helpers per BU',
                          employees: data.filter(r => r.PositionGroup === 'HELPER' && (r.OnLeaveCount || 0) > 0).map(r => ({
                            name: r.BU,
                            bu: r.BU,
                            assignment: r.PositionGroup,
                            count: r.OnLeaveCount || 0,
                            dateHired: '',
                            status: 'On Leave',
                            position: r.PositionGroup
                          }))
                        });
                      }}>Helper: {helperOnLeave}</span>
                    </>}
                    
                  />
                </div>
                {/* Small bar-chart cards: Driver, Helper, License Expiry */}
                <div className={styles.barCardGrid}>
                  {/* Driver tenure */}
                  <div className={styles.barCardSmall}>
                    <div className={styles.barCardTitle}>Driver Tenure</div>
                    <BarChartMini data={(function(){
                      const now = new Date();
                      const counts: Record<string, number> = { '0-2':0,'2-5':0,'5-7':0,'7-10':0,'10+':0,'No Hired Date':0 };
                      employeesFull.forEach(emp => {
                        const pos = String(emp.position || emp.Position || '').toLowerCase();
                        const dh = (emp as Record<string, unknown>).dateHired || (emp as Record<string, unknown>).DateHired || (emp as Record<string, unknown>).date_hired || '';
                        if (!pos.includes('driver')) return;
                        if (!dh) { counts['No Hired Date']++; return; }
                        const start = new Date(String(dh));
                        const years = (now.getFullYear() - start.getFullYear()) - (now.getMonth() < start.getMonth() || (now.getMonth()===start.getMonth() && now.getDate()<start.getDate()) ? 1 : 0);
                        if (years < 2) counts['0-2']++;
                        else if (years < 5) counts['2-5']++;
                        else if (years < 7) counts['5-7']++;
                        else if (years < 10) counts['7-10']++;
                        else counts['10+']++;
                      });
                      return [
                        { label: '0-2 yrs', value: counts['0-2'], color: '#2563eb' },
                        { label: '2-5 yrs', value: counts['2-5'], color: '#22c55e' },
                        { label: '5-7 yrs', value: counts['5-7'], color: '#facc15' },
                        { label: '7-10 yrs', value: counts['7-10'], color: '#ef4444' },
                        { label: '10+ yrs', value: counts['10+'], color: '#8b5cf6' },
                        { label: 'No Hired Date', value: counts['No Hired Date'], color: '#94a3b8' }
                      ];
                    })()} />
                  </div>

                  {/* Helper tenure */}
                  <div className={styles.barCardSmall}>
                    <div className={styles.barCardTitle}>Helper Tenure</div>
                    <BarChartMini data={(function(){
                      const now = new Date();
                      const counts: Record<string, number> = { '0-2':0,'2-5':0,'5-7':0,'7-10':0,'10+':0,'No Hired Date':0 };
                      employeesFull.forEach(emp => {
                        const pos = String(emp.position || emp.Position || '').toLowerCase();
                        const dh = (emp as Record<string, unknown>).dateHired || (emp as Record<string, unknown>).DateHired || (emp as Record<string, unknown>).date_hired || '';
                        if (!pos.includes('helper')) return;
                        if (!dh) { counts['No Hired Date']++; return; }
                        const start = new Date(String(dh));
                        const years = (now.getFullYear() - start.getFullYear()) - (now.getMonth() < start.getMonth() || (now.getMonth()===start.getMonth() && now.getDate()<start.getDate()) ? 1 : 0);
                        if (years < 2) counts['0-2']++;
                        else if (years < 5) counts['2-5']++;
                        else if (years < 7) counts['5-7']++;
                        else if (years < 10) counts['7-10']++;
                        else counts['10+']++;
                      });
                      return [
                        { label: '0-2 yrs', value: counts['0-2'], color: '#2563eb' },
                        { label: '2-5 yrs', value: counts['2-5'], color: '#22c55e' },
                        { label: '5-7 yrs', value: counts['5-7'], color: '#facc15' },
                        { label: '7-10 yrs', value: counts['7-10'], color: '#ef4444' },
                        { label: '10+ yrs', value: counts['10+'], color: '#8b5cf6' },
                        { label: 'No Hired Date', value: counts['No Hired Date'], color: '#94a3b8' }
                      ];
                    })()} />
                  </div>

                  {/* License expiry */}
                  <div className={styles.barCardSmall}>
                    <div className={styles.barCardTitle}>License Expiry</div>
                    <BarChartMini data={(function(){
                      const now = new Date();
                      const counts: Record<string, number> = { '<30':0,'<60':0,'<120':0,'<1yr':0,'>=1yr':0,'No Expiry':0 };
                      employeesFull.forEach(emp => {
                        const pos = String(emp.position || emp.Position || '').toLowerCase();
                        if (!pos.includes('driver')) return;
                        const expd = (emp as Record<string, unknown>).DriversLicenseExpiryDate || (emp as Record<string, unknown>).driversLicenseExpiryDate || (emp as Record<string, unknown>).licenseExpiry || (emp as Record<string, unknown>).LicenseExpiryDate || (emp as Record<string, unknown>).license_expiry || '';
                        if (!expd) { counts['No Expiry']++; return; }
                        const diff = Math.ceil((new Date(String(expd)).getTime() - now.getTime())/(1000*60*60*24));
                        if (diff < 30) counts['<30']++;
                        else if (diff < 60) counts['<60']++;
                        else if (diff < 120) counts['<120']++;
                        else if (diff < 365) counts['<1yr']++;
                        else counts['>=1yr']++;
                      });
                      return [
                        { label: '<30d', value: counts['<30'], color: '#ef4444' },
                        { label: '<60d', value: counts['<60'], color: '#facc15' },
                        { label: '<120d', value: counts['<120'], color: '#22c55e' },
                        { label: '<1yr', value: counts['<1yr'], color: '#2563eb' },
                        { label: '>=1yr', value: counts['>=1yr'], color: '#60a5fa' },
                        { label: 'No Expiry', value: counts['No Expiry'], color: '#94a3b8' }
                      ];
                    })()} />
                  </div>
                </div>

                {/* Extra KPI row: Tenure and License */}
                <div className={styles.kpiExtraGrid}>
                  <KpiCard
                    color="blue"
                    icon={<CalendarCheck size={24} color="#2563eb" />}
                    label="Driver Tenure"
                    count={employeesFull.filter(e => (e.position||e.Position||'').toString().toLowerCase().includes('driver')).length}
                    breakdown={<>
                      {(() => {
                        const now = new Date();
                        const counts: Record<string, number> = { '0-2':0,'2-5':0,'5-7':0,'7-10':0,'10+':0,'No Hired Date':0 };
                        employeesFull.forEach(emp => {
                          const pos = (emp.position||emp.Position||'').toString().toLowerCase();
                          const dh = emp.dateHired || emp.DateHired || emp.date_hired;
                          if (!pos.includes('driver')) return;
                          if (!dh) { counts['No Hired Date']++; return; }
                          const start = new Date(String(dh));
                          const years = (now.getFullYear() - start.getFullYear()) - (now.getMonth() < start.getMonth() || (now.getMonth()===start.getMonth() && now.getDate()<start.getDate()) ? 1 : 0);
                          if (years < 2) counts['0-2']++;
                          else if (years < 5) counts['2-5']++;
                          else if (years < 7) counts['5-7']++;
                          else if (years < 10) counts['7-10']++;
                          else counts['10+']++;
                        });
                        return Object.entries(counts).map(([k,v]) => (
                          <span key={k} className={styles.kpiBreakdownClickable} onClick={() => setKpiModal({ open:true, title:`Driver Tenure − ${k}`, rows: employeesFull.filter(emp => {
                            const pos = (emp.position||emp.Position||'').toString().toLowerCase();
                            const dh = emp.dateHired || emp.DateHired || emp.date_hired;
                            if (!pos.includes('driver')) return false;
                            if (k === 'No Hired Date') return !dh;
                            if (!dh) return false;
                            const start = new Date(String(dh));
                            const now2 = new Date();
                            const years = (now2.getFullYear() - start.getFullYear()) - (now2.getMonth() < start.getMonth() || (now2.getMonth()===start.getMonth() && now2.getDate()<start.getDate()) ? 1 : 0);
                            if (k==='0-2') return years < 2;
                            if (k==='2-5') return years >=2 && years <5;
                            if (k==='5-7') return years >=5 && years <7;
                            if (k==='7-10') return years >=7 && years <10;
                            if (k==='10+') return years >= 10;
                                  return false;
                          }) })}>{k}: {v}</span>
                        ));
                      })()}
                    </>}
                    
                  />

                  <KpiCard
                    color="green"
                    icon={<Users size={24} color="#22c55e" />}
                    label="Helper Tenure"
                    count={employeesFull.filter(e => (e.position||e.Position||'').toString().toLowerCase().includes('helper')).length}
                    breakdown={<>
                      {(() => {
                        const now = new Date();
                        const counts: Record<string, number> = { '0-2':0,'2-5':0,'5-7':0,'7-10':0,'10+':0,'No Hired Date':0 };
                        employeesFull.forEach(emp => {
                          const pos = (emp.position||emp.Position||'').toString().toLowerCase();
                          const dh = emp.dateHired || emp.DateHired || emp.date_hired;
                          if (!pos.includes('helper')) return;
                          if (!dh) { counts['No Hired Date']++; return; }
                          const start = new Date(String(dh));
                          const years = (now.getFullYear() - start.getFullYear()) - (now.getMonth() < start.getMonth() || (now.getMonth()===start.getMonth() && now.getDate()<start.getDate()) ? 1 : 0);
                          if (years < 2) counts['0-2']++;
                          else if (years < 5) counts['2-5']++;
                          else if (years < 7) counts['5-7']++;
                          else if (years < 10) counts['7-10']++;
                          else counts['10+']++;
                        });
                        return Object.entries(counts).map(([k,v]) => (
                          <span key={k} className={styles.kpiBreakdownClickable} onClick={() => setKpiModal({ open:true, title:`Helper Tenure − ${k}`, rows: employeesFull.filter(emp => {
                            const pos = (emp.position||emp.Position||'').toString().toLowerCase();
                            const dh = emp.dateHired || emp.DateHired || emp.date_hired;
                            if (!pos.includes('helper')) return false;
                            if (k === 'No Hired Date') return !dh;
                            if (!dh) return false;
                            const start = new Date(String(dh));
                            const now2 = new Date();
                            const years = (now2.getFullYear() - start.getFullYear()) - (now2.getMonth() < start.getMonth() || (now2.getMonth()===start.getMonth() && now2.getDate()<start.getDate()) ? 1 : 0);
                            if (k==='0-2') return years < 2;
                            if (k==='2-5') return years >=2 && years <5;
                            if (k==='5-7') return years >=5 && years <7;
                            if (k==='7-10') return years >=7 && years <10;
                          if (k==='10+') return years >= 10;
                            return false;
                          }) })}>{k}: {v}</span>
                        ));
                      })()}
                    </>}
                    
                  />

                  <KpiCard
                    color="yellow"
                    icon={<Clock size={24} color="#facc15" />}
                    label="License Expiration"
                    count={employeesFull.filter(e => (e.position||e.Position||'').toString().toLowerCase().includes('driver')).length}
                    breakdown={<>
                      {(() => {
                        const counts: Record<string, number> = { '<30':0,'<60':0,'<120':0,'<1yr':0,'>=1yr':0,'No Expiry':0 };
                        const now = new Date();
                        employeesFull.forEach(emp => {
                          const pos = (emp.position||emp.Position||'').toString().toLowerCase();
                          if (!pos.includes('driver')) return;
                          const expd = emp.DriversLicenseExpiryDate || emp.driversLicenseExpiryDate || emp.licenseExpiry || emp.LicenseExpiryDate;
                          if (!expd) { counts['No Expiry']++; return; }
                            const exp = new Date(String(expd));
                            const diff = Math.ceil((exp.getTime() - now.getTime())/(1000*60*60*24));
                            if (diff < 30) counts['<30']++;
                            else if (diff < 60) counts['<60']++;
                            else if (diff < 120) counts['<120']++;
                            else if (diff < 365) counts['<1yr']++;
                            else counts['>=1yr']++;
                        });
                          return Object.entries(counts).map(([k,v]) => (
                            <span key={k} className={styles.kpiBreakdownClickable} onClick={() => setKpiModal({ open:true, title:`License - ${k}`, rows: employeesFull.filter(emp => {
                            const pos = (emp.position||emp.Position||'').toString().toLowerCase();
                            if (!pos.includes('driver')) return false;
                            const expd = emp.DriversLicenseExpiryDate || emp.driversLicenseExpiryDate || emp.licenseExpiry || emp.LicenseExpiryDate;
                              if (k==='No Expiry') return !expd;
                              if (!expd) return false;
                              const diff = Math.ceil((new Date(String(expd)).getTime() - new Date().getTime())/(1000*60*60*24));
                              if (k=== '<30') return diff < 30;
                              if (k=== '<60') return diff < 60 && diff >=30;
                              if (k=== '<120') return diff < 120 && diff >=60;
                              if (k=== '<1yr') return diff < 365 && diff >=120;
                              if (k=== '>=1yr') return diff >= 365;
                            return false;
                          }) })}>{k}: {v}</span>
                        ));
                      })()}
                    </>}
                    
                  />
                </div>
                {kpiModal && (
                  <KPIListModal
                    open={kpiModal.open}
                    title={kpiModal.title}
                    columns={(() => {
                      if (kpiModal.title.toLowerCase().includes('license')) return [
                        { key: 'name', label: 'Employee Name' },
                        { key: 'bu', label: 'BU' },
                        { key: 'assignment', label: 'Area Assignment' },
                        { key: 'licenseExpiry', label: 'License Expiration' },
                        { key: 'daysValid', label: 'Days Valid' }
                      ];
                      return [
                        { key: 'name', label: 'Employee Name' },
                        { key: 'bu', label: 'BU' },
                        { key: 'assignment', label: 'Area Assignment' },
                        { key: 'dateHired', label: 'Date Hired' },
                        { key: 'tenure', label: 'Tenure' }
                      ];
                    })()}
                    rows={kpiModal.rows.map((emp: Record<string, unknown>) => {
                      const getField = (o: Record<string, unknown>, ...keys: string[]) => {
                        if (!o) return '';
                        const lowerMap = new Map<string, unknown>();
                        Object.keys(o).forEach(k => lowerMap.set(k.toLowerCase(), (o as Record<string, unknown>)[k as keyof Record<string, unknown>]));
                        for (const k of keys) {
                          const v = lowerMap.get(k.toLowerCase());
                          if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
                        }
                        return '';
                      };
                      // robust name detection across API shapes
                      const name = getField(emp, 'name', 'employee_name', 'employeeName', 'fullName', 'fullname', 'Name') || `${getField(emp,'firstName','first_name')} ${getField(emp,'lastName','last_name')}`.trim();
                      const bu = getField(emp, 'bu', 'BU', 'bu_name', 'business_unit');
                      const assignment = getField(emp, 'assignment', 'assignment_area', 'Position', 'position', 'role');
                      const dateHiredRaw = getField(emp, 'dateHired', 'DateHired', 'date_hired', 'hired_date');
                      const licenseExpiryRaw = getField(emp, 'DriversLicenseExpiryDate', 'driversLicenseExpiryDate', 'licenseExpiry', 'LicenseExpiryDate', 'license_expiry');
                      const formatDate = (v: string) => {
                        try { const d = new Date(String(v)); return isNaN(d.getTime()) ? '' : d.toLocaleDateString(); } catch { return String(v || ''); }
                      };
                      const dateHired = formatDate(dateHiredRaw);
                      const licenseExpiry = formatDate(licenseExpiryRaw);
                      // compute tenure string
                      let tenure = '';
                      if (dateHired) {
                        const start = new Date(String(dateHiredRaw));
                        const now = new Date();
                        let years = now.getFullYear() - start.getFullYear();
                        let months = now.getMonth() - start.getMonth();
                        if (now.getDate() < start.getDate()) months--;
                        if (months < 0) { years--; months += 12; }
                        tenure = `${years} yrs ${months} mos`;
                      }
                      let daysValid = '';
                      if (licenseExpiry) {
                        const diff = Math.ceil((new Date(String(licenseExpiryRaw)).getTime() - new Date().getTime())/(1000*60*60*24));
                        daysValid = String(diff);
                      }
                      return { name, bu, assignment, dateHired, tenure, licenseExpiry, daysValid };
                    })}
                    onClose={() => setKpiModal(null)}
                  />
                )}

                <EmployeeModal
                  open={!!modal?.open}
                  title={modal?.title || ''}
                  employees={modal?.employees || []}
                  onClose={() => setModal(null)}
                />
                {/* ...existing chart and table code will be refactored next... */}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Home;
