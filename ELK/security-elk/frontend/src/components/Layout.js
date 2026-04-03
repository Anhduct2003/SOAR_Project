import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
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

const NotificationCenter = ({ onViewAll }) => {
  const { alerts: realtimeAlerts } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [apiAlerts, setApiAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);
  const [lastReadAt, setLastReadAt] = useState(() => {
    const stored = localStorage.getItem('notificationLastReadAt');
    return stored ? Number(stored) : Date.now();
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get('/api/alerts', {
          params: {
            limit: 8,
            severity: 'low,medium,high,critical'
          }
        });
        setApiAlerts(res.data.data || []);
      } catch (error) {
        setApiAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const timer = setInterval(fetchAlerts, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = useMemo(() => {
    const map = new Map();

    [...realtimeAlerts, ...apiAlerts].forEach((item, index) => {
      const key = item.id || item._id || `${item.title || item.message}-${item.createdAt}-${index}`;
      if (!map.has(key)) {
        map.set(key, {
          ...item,
          key,
          displayTitle: item.title || item.message || 'New security event detected',
          displayTime: item.createdAt || item.timestamp || new Date().toISOString(),
          displaySeverity: item.severity || 'medium'
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => new Date(b.displayTime) - new Date(a.displayTime))
      .slice(0, 8);
  }, [apiAlerts, realtimeAlerts]);

  const unreadCount = notifications.filter(
    (item) => new Date(item.displayTime).getTime() > lastReadAt
  ).length;

  const markAsRead = () => {
    const readAt = Date.now();
    setLastReadAt(readAt);
    localStorage.setItem('notificationLastReadAt', String(readAt));
  };

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      markAsRead();
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    markAsRead();
    onViewAll();
  };

  return (
    <div className="notification-center" ref={panelRef}>
      <button
        className={`notification-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        title="System notifications"
      >
        <BellIcon style={{ width: 20, height: 20 }} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel animate-fade-in">
          <div className="notification-panel-header">
            <div>
              <h3>Notifications</h3>
              <p>{unreadCount > 0 ? `${unreadCount} new events` : 'Recent system activity'}</p>
            </div>
            <button className="notification-link" onClick={handleViewAll}>
              View all
            </button>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No alerts at the moment.</div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.key}
                  className="notification-item"
                  onClick={handleViewAll}
                >
                  <div className={`notification-severity severity-${item.displaySeverity}`} />
                  <div className="notification-copy">
                    <div className="notification-item-top">
                      <span className="notification-title">{item.displayTitle}</span>
                      <span className={`badge badge-${item.displaySeverity}`}>{item.displaySeverity}</span>
                    </div>
                    <span className="notification-time">
                      {new Date(item.displayTime).toLocaleString()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SystemHealth = () => {
  const [health, setHealth] = useState({
    backend: 'loading',
    mongodb: 'loading',
    elasticsearch: 'loading'
  });

  const checkHealth = async () => {
    try {
      const res = await axios.get('/api/health/status');
      setHealth(res.data.data);
    } catch (error) {
      setHealth({
        backend: 'disconnected',
        mongodb: 'disconnected',
        elasticsearch: 'disconnected'
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const timer = setInterval(checkHealth, 30000);
    return () => clearInterval(timer);
  }, []);

  const StatusDot = ({ status }) => (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor:
          status === 'connected'
            ? 'var(--color-low)'
            : status === 'loading'
              ? 'var(--text-muted)'
              : 'var(--color-critical)',
        boxShadow: status === 'connected' ? '0 0 8px var(--color-low)' : 'none'
      }}
    />
  );

  return (
    <div
      style={{
        display: 'flex',
        gap: '1.25rem',
        padding: '0 1rem',
        borderRight: '1px solid var(--border-color)',
        marginRight: '1rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}
        title="Backend API"
      >
        <ServerIcon style={{ width: 14 }} />
        <StatusDot status={health.backend} />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}
        title="MongoDB"
      >
        <CircleStackIcon style={{ width: 14 }} />
        <StatusDot status={health.mongodb} />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}
        title="Elasticsearch"
      >
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

  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    'Admin';

  const displayRole = user?.role || 'Security Analyst';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Incidents', path: '/incidents', icon: ShieldExclamationIcon },
    { name: 'Alerts', path: '/alerts', icon: BellIcon },
    { name: 'Users', path: '/users', icon: UsersIcon },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon }
  ];

  const getPageTitle = () => {
    const item = navItems.find((navItem) => navItem.path === location.pathname);
    return item ? item.name : 'Security Dashboard';
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <ShieldCheckIcon style={{ width: 32, height: 32, color: '#38bdf8' }} />
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
            style={{
              marginTop: 'auto',
              background: 'none',
              border: 'none',
              width: '100%',
              cursor: 'pointer'
            }}
          >
            <ArrowLeftOnRectangleIcon />
            <span>Dang xuat</span>
          </button>
        </nav>
      </aside>

      <main className="main-area">
        <header className="top-nav">
          <h2 className="page-title">{getPageTitle()}</h2>

          <div className="nav-right">
            <SystemHealth />
            <NotificationCenter onViewAll={() => navigate('/alerts')} />

            <button className="theme-toggle" onClick={toggleTheme} title="Doi giao dien">
              {theme === 'light' ? <MoonIcon style={{ width: 20 }} /> : <SunIcon style={{ width: 20 }} />}
            </button>

            <div className="user-profile">
              <div className="user-avatar">{displayName.charAt(0).toUpperCase()}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{displayName}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{displayRole}</span>
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
