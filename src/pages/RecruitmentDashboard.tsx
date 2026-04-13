import { useState, useEffect, type FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import Loading from '../components/Loading';
import styles from '../styles/RecruitmentDashboard.module.css';
import '../styles/App.css';
import '../styles/index.css';

interface PeriodRow { Period: string; Position: string; Total: number }
interface StatusRow { Status: string; Total: number }

interface DashboardData {
  daily: PeriodRow[];
  weekly: PeriodRow[];
  monthly: PeriodRow[];
  yearly: PeriodRow[];
  byStatus: StatusRow[];
}

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

const STATUS_COLORS = ['#1a237e', '#1976d2', '#43a047', '#e65100', '#8e24aa', '#d32f2f', '#00838f', '#6d4c41'];

function pivotData(rows: PeriodRow[]) {
  const map: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    if (!map[r.Period]) map[r.Period] = {};
    map[r.Period][r.Position] = (map[r.Period][r.Position] || 0) + r.Total;
  }
  return Object.entries(map)
    .map(([period, positions]) => ({ period, ...positions }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

function getPositionKeys(rows: PeriodRow[]) {
  return [...new Set(rows.map(r => r.Position))];
}

const POSITION_COLORS: Record<string, string> = {
  Driver: '#1a237e',
  Helper: '#1976d2',
  Unspecified: '#9e9e9e',
};

const RecruitmentDashboard: FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('monthly');
  const [theme, setTheme] = useState(localStorage.getItem('hrapp.theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('hrapp.theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/recruitment-dashboard`, {
          headers: { 'x-api-key': import.meta.env.VITE_API_KEY },
        });
        if (!res.ok) throw new Error('Failed to fetch recruitment dashboard');
        setData(await res.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('hrapp.authenticated');
    window.location.hash = '#/login';
  };

  const periodRows = data ? data[view] : [];
  const chartData = pivotData(periodRows);
  const positionKeys = getPositionKeys(periodRows);

  // Build table data for the selected view
  const tableData = chartData.map(row => {
    const total = positionKeys.reduce((sum, k) => sum + ((row as Record<string, unknown>)[k] as number || 0), 0);
    return { ...row, Total: total };
  });

  const viewLabels: Record<ViewMode, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

  // Map known positions to CSS module classes to avoid `any` usage
  const statClassMap: Record<string, string> = {
    Driver: styles.statCardDriver,
    Helper: styles.statCardHelper,
    Unspecified: styles.statCardUnspecified,
  };
  return (
    <div className="recruitment-bg">
      <TopBar theme={theme} setTheme={setTheme} handleLogout={handleLogout} />
      <div className="recruitment-content-row">
        <Sidebar />
        <main className="recruitment-main">
          <h2 className="recruitment-title">Recruitment Dashboard</h2>

          {loading && <Loading message="Loading recruitment dashboard..." />}
          {error && <p className="recruitment-error">Error: {error}</p>}

          {data && !loading && (
            <>
              {/* Overview stats */}
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Recruitments</div>
                  <div className={styles.statValue}>{data.daily.reduce((s, r) => s + r.Total, 0) + data.weekly.reduce((s, r) => s + r.Total, 0) + data.monthly.reduce((s, r) => s + r.Total, 0) + data.yearly.reduce((s, r) => s + r.Total, 0) ? ((data.daily.reduce((s, r) => s + r.Total, 0) + data.weekly.reduce((s, r) => s + r.Total, 0) + data.monthly.reduce((s, r) => s + r.Total, 0) + data.yearly.reduce((s, r) => s + r.Total, 0)) / 4).toFixed(0) : tableData.reduce((s, r) => s + r.Total, 0)}</div>
                  <div className={styles.statNote}>Aggregated overview</div>
                </div>
                {Object.entries(POSITION_COLORS).map(([pos]) => {
                  const cls = statClassMap[pos] || styles.statCardDefault;
                  return (
                    <div key={pos} className={`${styles.statCard} ${cls}`}>
                      <div className={styles.statLabel}>{pos}</div>
                      <div className={styles.statValue}>{tableData.reduce((s, r) => s + ((r as Record<string, unknown>)[pos] as number || 0), 0)}</div>
                      <div className={styles.statNote}>By selected view</div>
                    </div>
                  );
                })}
              </div>

              {/* (selector moved into main chart card) */}

              <div className={styles.chartsGrid}>
                <div className={styles.mainChartCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Recruitment Count ({viewLabels[view]})</h3>
                    <div className={styles.cardViewSelector}>
                      {(['daily', 'weekly', 'monthly', 'yearly'] as ViewMode[]).map(v => (
                        <button
                          key={v}
                          className={`rd-view-btn${view === v ? ' active' : ''}`}
                          onClick={() => setView(v)}
                        >
                          {viewLabels[v]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={420}>
                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <XAxis dataKey="period" tick={{ fontSize: 13 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      {positionKeys.map(k => (
                        <Bar key={k} dataKey={k} fill={POSITION_COLORS[k] || '#607d8b'} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={styles.sideChartCard}>
                  <h3 className={styles.chartTitle}>Recruitment by Status</h3>
                  <ResponsiveContainer width="100%" height={420}>
                    <PieChart>
                      <Pie
                        data={data.byStatus}
                        dataKey="Total"
                        nameKey="Status"
                        cx="50%"
                        cy="50%"
                        outerRadius={140}
                        label={({ name, value }: { name?: string; value?: number }) => `${name || ''}: ${value || 0}`}
                      >
                        {data.byStatus.map((_entry, idx) => (
                          <Cell key={idx} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom data container */}
              <div className={styles.bottomContainer}>
                <div className={styles.innerTableCard}>
                  <h3 className={styles.chartTitle}>Breakdown ({viewLabels[view]})</h3>
                  <div className={styles.tableWrap}>
                  <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      {positionKeys.map(k => <th key={k}>{k}</th>)}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr><td colSpan={positionKeys.length + 2} className="rd-empty-cell">No data for this period.</td></tr>
                    ) : (
                      tableData.map(row => (
                        <tr key={row.period}>
                          <td className="dashboard-team-label">{row.period}</td>
                          {positionKeys.map(k => <td key={k}>{(row as Record<string, unknown>)[k] as number || 0}</td>)}
                          <td><strong>{row.Total}</strong></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {tableData.length > 0 && (
                    <tfoot>
                      <tr>
                        <td className="dashboard-team-label">Grand Total</td>
                        {positionKeys.map(k => (
                          <td key={k}>{tableData.reduce((s, r) => s + ((r as Record<string, unknown>)[k] as number || 0), 0)}</td>
                        ))}
                        <td><strong>{tableData.reduce((s, r) => s + r.Total, 0)}</strong></td>
                      </tr>
                    </tfoot>
                  )}
                  </table>
                  </div>
                </div>

                <div className={styles.innerTableCard}>
                  <h3 className={styles.chartTitle}>Count by Status</h3>
                  <div className={styles.tableWrap}>
                  <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byStatus.map(row => (
                      <tr key={row.Status}>
                        <td className="dashboard-team-label">{row.Status}</td>
                        <td>{row.Total}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="dashboard-team-label">Total</td>
                      <td><strong>{data.byStatus.reduce((s, r) => s + r.Total, 0)}</strong></td>
                    </tr>
                  </tfoot>
                  </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default RecruitmentDashboard;
