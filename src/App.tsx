import { type ReactElement, type FC } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Login from './pages/Login';
import Home from './pages/Home';
import Employees from './pages/Employees';
import Recruitment from './pages/Recruitment';
import RecruitmentDashboard from './pages/RecruitmentDashboard';
import HelperToDriver from './pages/HelperToDriver';
import UserProfile from './pages/Profile';
import Notifications from './pages/Notifications';
import './styles/App.css';
import { NotificationsProvider } from './contexts/NotificationsContext';

const AUTH_KEY = 'hrapp.authenticated';

function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem(AUTH_KEY));
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

const App: FC = () => {
  return (
    <Router>
      <NotificationsProvider>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/employees" element={<RequireAuth><Employees /></RequireAuth>} />
        <Route path="/recruitment" element={<RequireAuth><Recruitment /></RequireAuth>} />
        <Route path="/recruitment-dashboard" element={<RequireAuth><RecruitmentDashboard /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/helper-to-driver" element={<RequireAuth><HelperToDriver /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
        </Routes>
      </NotificationsProvider>
    </Router>
  );
};

export default App;
