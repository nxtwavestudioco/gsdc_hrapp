import React, { type ReactElement } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Login from './pages/Login';
import Home from './pages/Home';
import Employees from './pages/Employees';
import Recruitment from './pages/Recruitment';
import RecruitmentDashboard from './pages/RecruitmentDashboard';
import HelperToDriver from './pages/HelperToDriver';
import UserProfile from './pages/Profile';
import './styles/App.css';

const AUTH_KEY = 'hrapp.authenticated';

function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem(AUTH_KEY));
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/employees" element={<RequireAuth><Employees /></RequireAuth>} />
        <Route path="/recruitment" element={<RequireAuth><Recruitment /></RequireAuth>} />
        <Route path="/recruitment-dashboard" element={<RequireAuth><RecruitmentDashboard /></RequireAuth>} />
        <Route path="/helper-to-driver" element={<RequireAuth><HelperToDriver /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
      </Routes>
    </Router>
  );
};

export default App;
