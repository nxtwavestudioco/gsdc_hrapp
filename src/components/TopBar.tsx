import React from 'react';
import '../styles/topbar.css';

interface TopBarProps {
  theme: string;
  setTheme: (theme: string) => void;
  handleLogout: () => void;
}

import companyLogo from '../assets/company-logo.png';
const LOGO_SRC = companyLogo;

const TopBar: React.FC<TopBarProps> = ({ theme, setTheme, handleLogout }) => (
  <div className="topbar">
    <div className="topbar-logo-box">
      <img
        src={LOGO_SRC}
        alt="Company Logo"
        className="topbar-logo-img"
        onError={e => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
    <div className="topbar-title-group">
      <span className="topbar-company-name">GREAT SIERRA DEVELOPMENT CORP</span>
      <h1 className="topbar-app-title">HR Management App</h1>
    </div>
    <div className="topbar-spacer" />
    <div className="topbar-actions">
      <button
        aria-label="Toggle theme"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="topbar-theme-toggle"
      >
        <span className="topbar-toggle-knob" />
      </button>
      <button className="topbar-logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  </div>
);

export default TopBar;
