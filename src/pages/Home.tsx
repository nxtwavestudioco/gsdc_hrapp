
import '../styles/App.css';
import '../styles/index.css';
import { useState, useEffect } from 'react';

import Loading from '../components/Loading';
import { createPortal } from 'react-dom';
import styles from '../styles/HomeStyles.module.css';
import { UserCheck, Users, UserX, Clock } from 'lucide-react';

// Reusable KPI Card component
function KpiCard({ color, icon, label, count, breakdown, onClick }: {
  color: 'blue' | 'green' | 'red' | 'yellow',
  icon: React.ReactNode,
  label: string,
  count: number,
  breakdown: React.ReactNode,
  onClick: () => void
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
      tabIndex={0}
      role="button"
      onClick={onClick}
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

function EmployeeModal({ open, title, employees, onClose }: { open: boolean; title: string; employees: Employee[]; onClose: () => void }) {
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (open) {
      // reset search when modal opens
      const id = setTimeout(() => setSearch(''), 0);
      return () => clearTimeout(id);
    }
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
      className={styles.modalOverlay}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2,6,23,0.55)',
        zIndex: 2147483647
      }}
      tabIndex={-1}
      onClick={onClose}
    >
      <div className={styles.modalCard} style={{ zIndex: 2147483648 }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeaderRow}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>
        <input
          className={styles.modalSearch}
          placeholder="Search BU or count..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
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
              ) : filtered.map((e, i) => (
                <tr key={i}>
                  <td>{e.bu || e.name}</td>
                  <td>{e.count ?? ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className={styles.modalTfootCell}>Total</td>
                <td className={styles.modalTfootCell}>{filtered.reduce((a, r) => a + Number(r.count ?? 0), 0)}</td>
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
  }, []);


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
                    </>}
                    onClick={() => { console.log('KPI click: opening All Employees'); setModal({
                      open: true,
                      title: 'All Employees',
                      employees: data.map(r => ({
                        name: r.BU + ' - ' + r.PositionGroup,
                        bu: r.BU,
                        assignment: r.PositionGroup,
                        dateHired: '',
                        status: '',
                        position: r.PositionGroup
                      }))
                    }); }}
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
                    onClick={() => { console.log('KPI click: opening Active Employees'); setModal({
                      open: true,
                      title: 'Active Employees',
                      employees: data.filter(r => r.ActiveCount > 0).map(r => ({
                        name: r.BU + ' - ' + r.PositionGroup,
                        bu: r.BU,
                        assignment: r.PositionGroup,
                        dateHired: '',
                        status: 'Active',
                        position: r.PositionGroup
                      }))
                    }); }}
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
                    onClick={() => { console.log('KPI click: opening Inactive Employees'); setModal({
                      open: true,
                      title: 'Inactive Employees',
                      employees: data.filter(r => r.InactiveCount > 0).map(r => ({
                        name: r.BU + ' - ' + r.PositionGroup,
                        bu: r.BU,
                        assignment: r.PositionGroup,
                        dateHired: '',
                        status: 'Inactive',
                        position: r.PositionGroup
                      }))
                    }); }}
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
                    onClick={() => { console.log('KPI click: opening On Leave Employees'); setModal({
                      open: true,
                      title: 'On Leave Employees',
                      employees: data.filter(r => r.OnLeaveCount > 0).map(r => ({
                        name: r.BU + ' - ' + r.PositionGroup,
                        bu: r.BU,
                        assignment: r.PositionGroup,
                        dateHired: '',
                        status: 'On Leave',
                        position: r.PositionGroup
                      }))
                    }); }}
                  />
                </div>
                {/* Modal for KPI cards */}
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
