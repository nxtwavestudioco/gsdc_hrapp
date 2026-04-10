import '../styles/App.css';
import '../styles/index.css';
import React, { useState } from 'react';
import loginStyles from '../styles/Login.module.css';

const AUTH_KEY = 'hrapp.authenticated';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@123';
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
    const u = username.trim();
    const p = password;
    if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, '1');
      window.location.href = HOME_PATH;
      return;
    }
    setMessage('Invalid username or password');
  };

  return (
    <div className={loginStyles.loginBg}>
      <div className={loginStyles.loginCardWrapper}>
        <form className={loginStyles.loginCard} onSubmit={handleSubmit}>
          <div className={loginStyles.loginHeaderRow}>
            <div className={loginStyles.loginLogoBox}>
              <img
                src={LOGO_SRC}
                alt="Company Logo"
                className={loginStyles.loginLogoImg}
                onError={e => { (e.target as HTMLImageElement).src = 'assets/company-logo.png'; }}
              />
            </div>
            <div className={loginStyles.loginHeaderTextCol}>
              <span className={loginStyles.loginAppTitle}>GREAT SIERRA DEVELOPMENT CORP</span>
              <h2 className={loginStyles.loginAppName}>HR Management App</h2>
            </div>
          </div>
          <h3 className={loginStyles.loginWelcomeCentered}>Welcome Back</h3>
          <div className={loginStyles.loginInputRow}>
            <label htmlFor="loginUsername" className={loginStyles.loginLabel}>Username</label>
            <input
              id="loginUsername"
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={loginStyles.loginInput}
            />
          </div>
          <div className={loginStyles.loginInputRow}>
            <label htmlFor="loginPassword" className={loginStyles.loginLabel}>Password</label>
            <input
              id="loginPassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={loginStyles.loginInput}
            />
          </div>
          <button type="submit" className={loginStyles.loginBtn}>Log In</button>
          {message && <div className={loginStyles.loginError}>{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login;