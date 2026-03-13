import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  HomeIcon, 
  ShieldExclamationIcon, 
  BellIcon, 
  UsersIcon, 
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  ServerIcon,
  CircleStackIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import './Layout.css';

const SystemHealth = () => {
  const [health, setHealth] = useState({ backend: 'loading', mongodb: 'loading', elasticsearch: 'loading' });

  const checkHealth = async () => {
    try {
      const res = await axios.get('/api/health/status');
      setHealth(res.data.data);
    } catch (e) {
      setHealth({ backend: 'disconnected', mongodb: 'disconnected', elasticsearch: 'disconnected' });
    }
  };

  useEffect(() => {
    checkHealth();
    const timer = setInterval(checkHealth, 30000);
    return () => clearInterval(timer);
  }, []);

  const StatusDot = ({ status }) => (
    <div style={{ 
      width: 8, height: 8, borderRadius: '50%', 
      backgroundColor: status === 'connected' ? 'var(--color-low)' : status === 'loading' ? 'var(--text-muted)' : 'var(--color-critical)',
      boxShadow: status === 'connected' ? '0 0 8px var(--color-low)' : 'none'
    }} />
  );

  return (
    <div style={{ display: 'flex', gap: '1.25rem', padding: '0 1rem', borderRight: '1px solid var(--border-color)', marginRight: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }} title="Backend API">
        <ServerIcon style={{ width: 14 }} />
        <StatusDot status={health.backend} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }} title="MongoDB">
        <CircleStackIcon style={{ width: 14 }} />
        <StatusDot status={health.mongodb} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }} title="Elasticsearch">
        <GlobeAltIcon style={{ width: 14 }} />
        <StatusDot status={health.elasticsearch} />
      </div>
    </div>
  );
};

const Layout = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Incidents', path: '/incidents', icon: ShieldExclamationIcon },
    { name: 'Alerts', path: '/alerts', icon: BellIcon },
    { name: 'Users', path: '/users', icon: UsersIcon },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ];

  const getPageTitle = () => {
    const item = navItems.find(item => item.path === location.pathname);
    return item ? item.name : 'Security Dashboard';
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <ShieldCheckIcon className="w-8 h-8 text-sky-400" style={{ width: 32, height: 32, color: '#38bdf8' }} />
            <span>Cyber Sentinel</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon />
              <span>{item.name}</span>
            </NavLink>
          ))}
          
          <button 
            onClick={handleLogout} 
            className="sidebar-link" 
            style={{ marginTop: 'auto', background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}
          >
            <ArrowLeftOnRectangleIcon />
            <span>Đăng xuất</span>
          </button>
        </nav>
      </aside>

      {/* Main Area */}
      <main className="main-area">
        <header className="top-nav">
          <h2 className="page-title">{getPageTitle()}</h2>
          
          <div className="nav-right">
            <SystemHealth />
            
            <button className="theme-toggle" onClick={toggleTheme} title="Đổi giao diện">
              {theme === 'light' ? <MoonIcon style={{ width: 20 }} /> : <SunIcon style={{ width: 20 }} />}
            </button>
            
            <div className="user-profile">
              <div className="user-avatar">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name || 'Admin'}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.role || 'Security Analyst'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-wrapper animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
