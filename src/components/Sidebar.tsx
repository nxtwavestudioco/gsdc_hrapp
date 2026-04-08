import React from 'react';
import '../styles/sidebar.css';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Employees', path: '/employees' },
  { label: 'Recruitment', path: '/recruitment' },
  { label: 'Recruitment Dashboard', path: '/recruitment-dashboard' },
  { label: 'Helper to Driver', path: '/helper-to-driver' },
  { label: 'User Profile', path: '/profile' },
];

const Sidebar: React.FC = () => {
  const activePath = typeof window !== 'undefined' ? (window.location.hash.replace('#', '') || '/') : '/';
  return (
    <aside className="sidebar-custom">
      <nav className="sidebar-nav-custom">
        {navItems.map(({ label, path }) => (
          <button
            key={label}
            className={`sidebar-nav-btn${activePath === path ? ' active' : ''}`}
            onClick={() => window.location.hash = '#' + path}
          >
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
