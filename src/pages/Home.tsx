import '../styles/App.css';
import '../styles/index.css';
import { useState, useEffect } from 'react';
// Types for tenure and license dashboard
interface TenureDashboardGroup {
  count: number;
  list: { name: string; dateHired: string }[];
}
interface TenureDashboardData {
  driver: Record<string, TenureDashboardGroup>;
  helper: Record<string, TenureDashboardGroup>;
}
interface LicenseExpiryDashboardGroup {
  count: number;
  list: { name: string; expiry: string }[];
}
interface LicenseExpiryDashboardData {
  [bucket: string]: LicenseExpiryDashboardGroup;
}
import Loading from '../components/Loading';
import styles from '../styles/HomeStyles.module.css';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import { PieChart, Pie, Tooltip, Legend } from 'recharts';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList, ResponsiveContainer, Cell } from 'recharts';

// Custom label for clickable bar numbers (aligned with bars)
const makeClickableBarLabel = (buckets: string[], type: string, setModalState: unknown) => (props: unknown) => {
  const { x, y, value, index, width, height } = props as { x?: number, y?: number, value?: number, index: number, width?: number, height?: number };
  const bucket = buckets[index];
  // Adjust x/y so the label is vertically centered on the bar and right-aligned just after the bar
  const xPos = (x ?? 0) + (width ?? 0) + 8; // 8px padding after bar
  const yPos = (y ?? 0) + ((height ?? 24) / 2); // center on bar
  return (
    <text
      x={xPos}
      y={yPos}
      className={styles.dashboardBarClickable}
      onClick={() => (setModalState as React.Dispatch<React.SetStateAction<{ type: string; bucket: string } | null>>)({ type, bucket })}
      textAnchor="start"
      alignmentBaseline="middle"
      fontSize={18}
      paintOrder="stroke"
      stroke="#fff"
      strokeWidth={2}
      strokeLinejoin="round"
      strokeOpacity={0.7}
    >
      <tspan fill="#222" stroke="none">{value}</tspan>
    </text>
  );
};

interface DashboardSummaryRow {
  BU: string;
  PositionGroup: string;
  TotalCount: number;
  DeployedCount: number;
  ApprenticeCount: number;
  UndeployedCount: number;
  ActiveCount: number;
  OnLeaveCount: number;
  InactiveCount: number;
  RecruitmentCount: number;
  HelperToDriverCount: number;
  AttachmentCount: number;
}

// const LOGO_SRC = import.meta.env.BASE_URL ? import.meta.env.BASE_URL + 'assets/company-logo.png' : '/assets/company-logo.png';

function Home() {
  // Tenure and License Expiry Dashboard State
  const [tenureDashboard, setTenureDashboard] = useState<TenureDashboardData | null>(null);
  const [licenseExpiryDashboard, setLicenseExpiryDashboard] = useState<LicenseExpiryDashboardData | null>(null);
  // Fetch tenure and license expiry dashboard data
  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const [tenureRes, licenseRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL}/employees/tenure-dashboard`, {
            headers: { 'x-api-key': import.meta.env.VITE_API_KEY },
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/employees/license-expiry-dashboard`, {
            headers: { 'x-api-key': import.meta.env.VITE_API_KEY },
          })
        ]);
        if (tenureRes.ok) setTenureDashboard(await tenureRes.json());
        if (licenseRes.ok) setLicenseExpiryDashboard(await licenseRes.json());
      } catch {
        // Ignore for now, can add error state if needed
      }
    };
    fetchDashboards();
  }, []);

  // Modal state for group details
  const [modalState, setModalState] = useState<null | { type: string; bucket: string }>(null);

  // Modal content logic
  let modalContent = null;
  if (modalState && tenureDashboard && licenseExpiryDashboard) {
    if (modalState.type === 'tenure-driver') {
      const group = tenureDashboard.driver[modalState.bucket];
      // Map and sort by dateHired ascending
      const items = group.list.slice().sort((a, b) => a.name.localeCompare(b.name));
      modalContent = (
        <GroupDetailModal
          open={true}
          onClose={() => setModalState(null)}
          title={`Drivers: ${modalState.bucket} yrs`}
          items={items}
          itemLabel="Date Hired"
          itemDateLabel="dateHired"
          showBU={true}
          showAssignment={true}
        />
      );
    } else if (modalState.type === 'tenure-helper') {
      const group = tenureDashboard.helper[modalState.bucket];
      const items = group.list.slice().sort((a, b) => a.name.localeCompare(b.name));
      modalContent = (
        <GroupDetailModal
          open={true}
          onClose={() => setModalState(null)}
          title={`Helpers: ${modalState.bucket} yrs`}
          items={items}
          itemLabel="Date Hired"
          itemDateLabel="dateHired"
          showBU={true}
          showAssignment={true}
        />
      );
    } else if (modalState.type === 'license') {
      // Fix bucket mapping for 120+ days
      let bucket = modalState.bucket;
      if (bucket === '120+' && !licenseExpiryDashboard[bucket] && licenseExpiryDashboard['<120+']) bucket = '<120+';
      const group = licenseExpiryDashboard[bucket];
      const items = group && group.list
        ? group.list.slice().sort((a, b) => a.name.localeCompare(b.name))
        : [];
      modalContent = (
        <GroupDetailModal
          open={true}
          onClose={() => setModalState(null)}
          title={`License Expiry: ${modalState.bucket}`}
          items={items}
          itemLabel="Expiry Date"
          itemDateLabel="expiry"
          showBU={true}
          showAssignment={true}
        />
      );
    }
  }

  // GroupDetailModal component
  type GroupDetailModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    items: { name: string; [key: string]: string }[];
    itemLabel: string;
    itemDateLabel: string;
    showBU?: boolean;
    showAssignment?: boolean;
  };
  function GroupDetailModal({ open, onClose, title, items, itemLabel, itemDateLabel, showBU, showAssignment }: GroupDetailModalProps) {
    if (!open) return null;
    // Format date to MM/DD/YYYY
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString();
    };

    // Export to Excel
    const handleExport = () => {
      const headers = [
        'Name',
        ...(showBU ? ['BU/Cost Center'] : []),
        ...(showAssignment ? ['Area Assignment'] : []),
        itemLabel
      ];
      const rows = items.map(item => [
        item.name,
        ...(showBU ? [item.bu || ''] : []),
        ...(showAssignment ? [item.assignment || ''] : []),
        formatDate(item[itemDateLabel])
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-content-large" onClick={e => e.stopPropagation()}>
          <div className="modal-header-row">
            <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
            <button className="modal-export-btn modal-export-btn-right" onClick={handleExport} title="Download">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0-4-4m4 4 4-4"/><rect width="18" height="4" x="3" y="17" rx="2" fill="#2563eb"/></svg>
            </button>
          </div>
          <h2 className="modal-title-large">{title}</h2>
          <table className="modal-table">
            <thead>
              <tr>
                <th>Name</th>
                {showBU && <th>BU/Cost Center</th>}
                {showAssignment && <th>Area Assignment</th>}
                <th>{itemLabel}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={3 + (showBU ? 1 : 0) + (showAssignment ? 1 : 0)} className="modal-table-empty">No data found.</td></tr>
              ) : items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  {showBU && <td>{item.bu || ''}</td>}
                  {showAssignment && <td>{item.assignment || ''}</td>}
                  <td>{formatDate(item[itemDateLabel])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  const [dashboardRows, setDashboardRows] = useState<DashboardSummaryRow[]>([]);
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
        const dashRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard/summary`, {
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY },
        });
        if (!dashRes.ok) throw new Error('Failed to fetch dashboard');
        const dashData = await dashRes.json();
        setDashboardRows(Array.isArray(dashData) ? dashData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // const navItems = [
  //   { label: 'Dashboard', path: '/' },
  //   { label: 'Employees', path: '/employees' },
  //   { label: 'Recruitment', path: '/recruitment' },
  //   { label: 'Helper to Driver', path: '/helper-to-driver' },
  //   { label: 'User Profile', path: '/profile' },
  // ];

  const handleLogout = () => {
    localStorage.removeItem('hrapp.authenticated');
    window.location.hash = '#/login';
  };

  // Group dashboardRows by BU
  const groupedByBU: Record<string, DashboardSummaryRow[]> = {};
  dashboardRows.forEach(row => {
    if (!groupedByBU[row.BU]) groupedByBU[row.BU] = [];
    groupedByBU[row.BU].push(row);
  });

  // BU groupings as specified
  // Find all unique BUs in data
  const allBUs = Array.from(new Set(dashboardRows.map(r => r.BU)));
  const mainGroups = [
    {
      name: 'CEMENT LUZON',
      members: ['BO-SBUO-1A','BO-SBUO-1B','BO-SBUO-1C','BO-SBUO-1D','BO-SBUO-2A','BO-SBUO-3A']
    },
    {
      name: 'CARGO',
      members: ['BD-BU CARGO-2','BD-BU CARGO-3A']
    },
    {
      name: 'PORT',
      members: ['BO-PORT']
    },
    {
      name: 'CEMENT VISMIN',
      members: ['BO-DAVAO','BO-LUGAIT','BO-CEBU']
    }
  ];
  // Find BUs not in any group
  const groupedBUs = mainGroups.flatMap(g => g.members);
  const otherBUs = allBUs.filter(bu => !groupedBUs.includes(bu));
  const BU_GROUPS = [
    ...mainGroups,
    ...(otherBUs.length > 0 ? [{ name: 'OTHERS', members: otherBUs }] : [])
  ];

  // Group dashboardRows by BU group
  const groupedByGroup = BU_GROUPS.map(group => ({
    ...group,
    rows: dashboardRows.filter(row => group.members.includes(row.BU))
  })).filter(g => g.rows.length > 0);

  // Calculate summary values for cards
  const totalEmployees = dashboardRows.reduce((a, r) => a + (r.TotalCount || 0), 0);
  const totalActive = dashboardRows.reduce((a, r) => a + (r.ActiveCount || 0), 0);
  const totalOnLeave = dashboardRows.reduce((a, r) => a + (r.OnLeaveCount || 0), 0);
  const totalInactive = dashboardRows.reduce((a, r) => a + (r.InactiveCount || 0), 0);

  // Prepare data for overall charts
  const statusData = [
    { name: 'Active', value: totalActive },
    { name: 'On Leave', value: totalOnLeave },
    { name: 'Inactive', value: totalInactive },
  ];
  const deployData = [
    { name: 'Deployed', value: dashboardRows.reduce((a, r) => a + (r.DeployedCount || 0), 0) },
    { name: 'Apprentice', value: dashboardRows.reduce((a, r) => a + (r.ApprenticeCount || 0), 0) },
    { name: 'Undeployed', value: dashboardRows.reduce((a, r) => a + (r.UndeployedCount || 0), 0) },
  ];
  const COLORS = ['#22c55e', '#facc15', '#ef4444'];
  const DEPLOY_COLORS = ['#2563eb', '#06b6d4', '#f87171'];

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }
  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }
  return (
    <div className={`dashboard-main-bg theme-${theme}`}> 
      <TopBar theme={theme} setTheme={setTheme} handleLogout={handleLogout} />
      {/* Content Row: Sidebar + Main Content */}
      <div className={`dashboard-content-row theme-${theme}`}> 
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content */}
        <main className="dashboard-main">
          <div className="dashboard-cards">
            <div className={styles.dashboardCard}>
              <span className="stat-title">Employee Count</span>
              <span className="stat-number">{totalEmployees}</span>
            </div>
            <div className={styles.dashboardCard}>
              <span className="stat-title">Active</span>
              <span className="stat-number active">{totalActive}</span>
            </div>
            <div className={styles.dashboardCard}>
              <span className="stat-title">On Leave</span>
              <span className="stat-number on-leave">{totalOnLeave}</span>
            </div>
            <div className={styles.dashboardCard}>
              <span className="stat-title">Inactive</span>
              <span className="stat-number inactive">{totalInactive}</span>
            </div>
            {/* Drivers Tenure Bar Graph */}
            {tenureDashboard && (
              <div className={`${styles.dashboardCard} ${styles.dashboardCardLarge}`}>
                <span className="stat-title stat-title-large">Drivers Tenure</span>
                <ResponsiveContainer width="100%" height={220} minWidth={420}>
                  <BarChart
                    layout="vertical"
                    data={Object.entries(tenureDashboard.driver).map(([bucket, group]) => ({
                      name: `${bucket} yrs`,
                      count: group.count,
                      bucket
                    }))}
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} hide={false} />
                    <YAxis dataKey="name" type="category" width={90} />
                    <Bar dataKey="count" radius={[6, 6, 6, 6]} cursor="pointer"
                      onClick={(_, index) => {
                        const data = Object.entries(tenureDashboard.driver).map(([bucket, group]) => ({ name: `${bucket} yrs`, count: group.count, bucket }))[index];
                        setModalState({ type: 'tenure-driver', bucket: data.bucket });
                      }}
                    >
                      {Object.keys(tenureDashboard.driver).map((bucket, idx) => (
                        <Cell key={bucket} fill={["#2563eb", "#22c55e", "#f59e42", "#ef4444"][idx % 4]} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="right"
                        content={makeClickableBarLabel(Object.keys(tenureDashboard.driver), 'tenure-driver', setModalState)}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Helpers Tenure Bar Graph */}
            {tenureDashboard && (
              <div className={`${styles.dashboardCard} ${styles.dashboardCardLarge}`}>
                <span className="stat-title stat-title-large">Helpers Tenure</span>
                <ResponsiveContainer width="100%" height={220} minWidth={420}>
                  <BarChart
                    layout="vertical"
                    data={Object.entries(tenureDashboard.helper).map(([bucket, group]) => ({
                      name: `${bucket} yrs`,
                      count: group.count,
                      bucket
                    }))}
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} hide={false} />
                    <YAxis dataKey="name" type="category" width={90} />
                    <Bar dataKey="count" radius={[6, 6, 6, 6]} cursor="pointer"
                      onClick={(_, index) => {
                        const data = Object.entries(tenureDashboard.helper).map(([bucket, group]) => ({ name: `${bucket} yrs`, count: group.count, bucket }))[index];
                        setModalState({ type: 'tenure-helper', bucket: data.bucket });
                      }}
                    >
                      {Object.keys(tenureDashboard.helper).map((bucket, idx) => (
                        <Cell key={bucket} fill={["#2563eb", "#22c55e", "#f59e42", "#ef4444"][idx % 4]} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="right"
                        content={makeClickableBarLabel(Object.keys(tenureDashboard.helper), 'tenure-helper', setModalState)}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* License Expiry Bar Graph */}
            {licenseExpiryDashboard && (
              <div className={`${styles.dashboardCard} ${styles.dashboardCardLarge}`}>
                <span className="stat-title stat-title-large">License Expiry</span>
                <ResponsiveContainer width="100%" height={220} minWidth={420}>
                  <BarChart
                    layout="vertical"
                    data={Object.entries(licenseExpiryDashboard).map(([bucket, group]) => ({
                      name: bucket === 'No Expiry' ? 'No Expiry' : `${bucket} Days`,
                      count: group.count,
                      bucketKey: bucket
                    }))}
                    margin={{ left: 20, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} hide={false} />
                    <YAxis dataKey="name" type="category" width={90} />
                    <Bar dataKey="count" radius={[6, 6, 6, 6]} cursor="pointer"
                      onClick={(data) => {
                        if (data && data.payload && data.payload.bucketKey) setModalState({ type: 'license', bucket: data.payload.bucketKey });
                      }}
                    >
                      {Object.keys(licenseExpiryDashboard).map((bucket) => {
                        let color = '#22c55e';
                        if (bucket === '<30') color = '#ef4444';
                        else if (bucket === '<60') color = '#f59e42';
                        else if (bucket === '<90') color = '#facc15';
                        else if (bucket === '<120+') color = '#22c55e';
                        else if (bucket === 'No Expiry') color = '#64748b';
                        return <Cell key={bucket} fill={color} />;
                      })}
                      <LabelList
                        dataKey="count"
                        position="right"
                        content={makeClickableBarLabel(Object.keys(licenseExpiryDashboard), 'license', setModalState)}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Show No Expiry count below the chart */}
                {licenseExpiryDashboard['No Expiry'] && (
                  <div
                    className={styles.dashboardClickableCount}
                    onClick={() => setModalState({ type: 'license', bucket: 'No Expiry' })}
                    title="Show details"
                  >
                    No License Expiration: {licenseExpiryDashboard['No Expiry'].count}
                  </div>
                )}
              </div>
            )}
          </div>
          {modalContent}
          {/* Modern Charts Section */}
          <div className="dashboard-charts">
            {/* Pie Chart: Employment Status */}
            <div className="dashboard-chart-card">
              <span className="dashboard-chart-title">Employment Status</span>
              <ResponsiveContainer width="100%" height={220} minWidth={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {statusData.map((_, idx) => (
                      <Cell key={`cell-status-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Pie Chart: Deployment Status */}
            <div className="dashboard-chart-card">
              <span className="dashboard-chart-title">Deployment Status</span>
              <ResponsiveContainer width="100%" height={220} minWidth={220}>
                <PieChart>
                  <Pie data={deployData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {deployData.map((_, idx) => (
                      <Cell key={`cell-deploy-${idx}`} fill={DEPLOY_COLORS[idx % DEPLOY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Grouped Table Section */}
          <div className="dashboard-group-section">
            {groupedByGroup.map(group => {
              const gDrivers = group.rows.filter(r => (r.PositionGroup || '').toUpperCase() === 'DRIVER').reduce((a, r) => a + (r.TotalCount || 0), 0);
              const gHelpers = group.rows.filter(r => (r.PositionGroup || '').toUpperCase() === 'HELPER').reduce((a, r) => a + (r.TotalCount || 0), 0);
              const gOthers = group.rows.filter(r => (r.PositionGroup || '').toUpperCase() === 'OTHERS').reduce((a, r) => a + (r.TotalCount || 0), 0);
              const gDeployed = group.rows.reduce((a, r) => a + (r.DeployedCount || 0), 0);
              const gUndeployed = group.rows.reduce((a, r) => a + (r.UndeployedCount || 0), 0);
              const gApprentice = group.rows.reduce((a, r) => a + (r.ApprenticeCount || 0), 0);
              return (
                <div key={group.name} className="dashboard-group-card">
                  <div className="dashboard-group-title">{group.name}</div>
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Team</th>
                        <th>Drivers</th>
                        <th>Helpers</th>
                        <th>No Tagged Position</th>
                        <th>Deployed</th>
                        <th>Undeployed</th>
                        <th>Apprentice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.members.map(team => {
                        const teamRows = group.rows.filter(r => r.BU === team);
                        const drivers = teamRows.filter(r => (r.PositionGroup || '').toUpperCase() === 'DRIVER').reduce((a, r) => a + (r.TotalCount || 0), 0);
                        const helpers = teamRows.filter(r => (r.PositionGroup || '').toUpperCase() === 'HELPER').reduce((a, r) => a + (r.TotalCount || 0), 0);
                        const noPosition = teamRows.filter(r => (r.PositionGroup || '').toUpperCase() === 'OTHERS').reduce((a, r) => a + (r.TotalCount || 0), 0);
                        const deployed = teamRows.reduce((a, r) => a + (r.DeployedCount || 0), 0);
                        const undeployed = teamRows.reduce((a, r) => a + (r.UndeployedCount || 0), 0);
                        const apprentice = teamRows.reduce((a, r) => a + (r.ApprenticeCount || 0), 0);
                        return (
                          <tr key={team}>
                            <td className="dashboard-team-label">{team.replace(/^(BO|BD)-(BU\s?)?/i, '')}</td>
                            <td>{drivers}</td>
                            <td>{helpers}</td>
                            <td>{noPosition}</td>
                            <td>{deployed}</td>
                            <td>{undeployed}</td>
                            <td>{apprentice}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="dashboard-team-label">Total</td>
                        <td>{gDrivers}</td>
                        <td>{gHelpers}</td>
                        <td>{gOthers}</td>
                        <td>{gDeployed}</td>
                        <td>{gUndeployed}</td>
                        <td>{gApprentice}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            })}
          </div>
        {modalContent}
        </main>
      </div>
    </div>
  );
}

export default Home;
