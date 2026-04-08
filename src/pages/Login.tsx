import '../styles/App.css';
import '../styles/index.css';
import React, { useState } from 'react';

const AUTH_KEY = 'hrapp.authenticated';
// const ADMIN_USERNAME = 'admin';
// const ADMIN_PASSWORD = 'Admin@123';
const HOME_PATH = '#/';
import companyLogo from '../assets/company-logo.png';
const LOGO_SRC = companyLogo;

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    // Set glassy, colorful radial background on body for login page
    const prevBg = document.body.style.background;
    const prevBgImg = document.body.style.backgroundImage;
    const prevBgColor = document.body.style.backgroundColor;
    document.body.style.background = 'radial-gradient(circle at 25% 30%, #2563eb 0%, #1e293b 40%, #0f172a 100%)';
    document.body.style.backgroundImage = 'radial-gradient(circle at 70% 70%, #14b8a6 0%, transparent 60%)';
    document.body.style.backgroundColor = '#0f172a';
    if (localStorage.getItem(AUTH_KEY)) {
      window.location.href = HOME_PATH;
    }
    return () => {
      document.body.style.background = prevBg;
      document.body.style.backgroundImage = prevBgImg;
      document.body.style.backgroundColor = prevBgColor;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Example: Replace with real authentication logic
    if (username === 'admin' && password === 'Admin@123') {
      localStorage.setItem(AUTH_KEY, 'true');
      window.location.href = HOME_PATH;
    } else {
      setMessage('Invalid username or password');
    }
  };

  return (
    <div className="login-bg">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-header-row">
          <div className="login-logo-box">
            <img
              src={LOGO_SRC}
              alt="Company Logo"
              className="login-logo-img"
              onError={e => { (e.target as HTMLImageElement).src = 'assets/company-logo.png'; }}
            />
          </div>
          <div className="login-header-text-col">
            <span className="login-app-title">GREAT SIERRA DEVELOPMENT CORP</span>
            <h2 className="login-app-name">HR Management App</h2>
          </div>
        </div>
        <h3 className="login-welcome">Welcome Back</h3>
        <div className="login-input-row mb10">
          <label htmlFor="loginUsername" className="login-label">Username</label>
          <input
            id="loginUsername"
            type="text"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="login-input"
          />
        </div>
        <div className="login-input-row mb16">
          <label htmlFor="loginPassword" className="login-label">Password</label>
          <input
            id="loginPassword"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="login-input"
          />
        </div>
        <button type="submit" className="login-btn">Log In</button>
        {message && (
          <div className="login-error">{message}</div>
        )}
      </form>
    </div>
  );
}

export default Login;