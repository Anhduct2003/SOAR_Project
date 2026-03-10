import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              <h1>Security SIRS</h1>
            </Link>
            {isAuthenticated && (
              <nav className="nav">
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/incidents" className="nav-link">Sự cố</Link>
                <Link to="/alerts" className="nav-link">Cảnh báo</Link>
                <Link to="/users" className="nav-link">Người dùng</Link>
                <Link to="/settings" className="nav-link">Cài đặt</Link>
                <div className="user-menu">
                  <span className="username">{user?.name || 'User'}</span>
                  <button onClick={handleLogout} className="logout-btn">
                    Đăng xuất
                  </button>
                </div>
              </nav>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          {children || <Outlet />}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Security Incident Response System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
