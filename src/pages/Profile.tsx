import { useState, useEffect, type FC } from 'react';
import '../styles/App.css';
import '../styles/index.css';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';

const UserProfile: FC = () => {
  const [theme, setTheme] = useState(localStorage.getItem('hrapp.theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('hrapp.theme', theme);
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem('hrapp.authenticated');
    window.location.hash = '#/login';
  };

  return (
    <div className="recruitment-bg">
      <TopBar theme={theme} setTheme={setTheme} handleLogout={handleLogout} />
      <div className="recruitment-content-row">
        <Sidebar />
        <main className="recruitment-main">
          <h2 className="recruitment-title">User Profile</h2>
          <div className="recruitment-header-row">
            <button className="sidebar-btn recruitment-btn" onClick={() => window.location.hash = '#/'}>Back to Dashboard</button>
          </div>
          <div className="recruitment-table-card">
            <h3 className="recruitment-table-title">User Profile</h3>
            <div className="profile-content">
              <p>This page will display and allow editing of user profile information.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
