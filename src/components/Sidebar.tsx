import React from 'react';
import '../styles/sidebar.css';
import { useNotifications } from '../contexts/NotificationsContext';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Employees', path: '/employees' },
  { label: 'Recruitment', path: '/recruitment' },
  { label: 'Recruitment Dashboard', path: '/recruitment-dashboard' },
  { label: 'Helper to Driver', path: '/helper-to-driver' },
  { label: 'Notifications', path: '/notifications' },
  { label: 'User Profile', path: '/profile' },
];

const Sidebar: React.FC = () => {
  const { expiringDriversCount } = useNotifications();
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
            <span>{label}</span>
            {label === 'Notifications' && (expiringDriversCount === null || (typeof expiringDriversCount === 'number' && expiringDriversCount > 0)) && (
              <span className="nav-badge" aria-hidden>{expiringDriversCount === null ? '...' : expiringDriversCount}</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
