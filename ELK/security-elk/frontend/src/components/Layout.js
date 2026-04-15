import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  ArrowLeftOnRectangleIcon,
  BellIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  HomeIcon,
  MoonIcon,
  ServerIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  SunIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import './Layout.css';

const NotificationCenter = ({ onViewAll }) => {
  const { alerts: realtimeAlerts } = useSocket();
  const { formatDateTime, t } = useLocalization();
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
        const severity = item.severity || 'medium';
        map.set(key, {
          ...item,
          key,
          displayTitle: item.title || item.message || t('socket.newIncident'),
          displayTime: item.createdAt || item.timestamp || new Date().toISOString(),
          displaySeverity: severity
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => new Date(b.displayTime) - new Date(a.displayTime))
      .slice(0, 8);
  }, [apiAlerts, realtimeAlerts, t]);

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
        title={t('layout.notifications.buttonTitle')}
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
              <h3>{t('layout.notifications.title')}</h3>
              <p>
                {unreadCount > 0
                  ? t('layout.notifications.newEvents', { count: unreadCount })
                  : t('layout.notifications.recentActivity')}
              </p>
            </div>
            <button className="notification-link" onClick={handleViewAll}>
              {t('common.actions.viewAll')}
            </button>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">{t('layout.notifications.loading')}</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">{t('layout.notifications.empty')}</div>
            ) : (
              notifications.map((item) => (
                <button key={item.key} className="notification-item" onClick={handleViewAll}>
                  <div className={`notification-severity severity-${item.displaySeverity}`} />
                  <div className="notification-copy">
                    <div className="notification-item-top">
                      <span className="notification-title">{item.displayTitle}</span>
                      <span className={`badge badge-${item.displaySeverity}`}>
                        {t(`common.severity.${item.displaySeverity}`)}
                      </span>
                    </div>
                    <span className="notification-time">{formatDateTime(item.displayTime)}</span>
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
  const { t } = useLocalization();
  const [health, setHealth] = useState({
    backend: 'loading',
    mongodb: 'loading',
    elasticsearch: 'loading'
  });

  useEffect(() => {
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
      title={t('common.status.systemHealth')}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}
        title={t('layout.systemHealth.backend')}
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
        title={t('layout.systemHealth.mongodb')}
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
        title={t('layout.systemHealth.elasticsearch')}
      >
        <GlobeAltIcon style={{ width: 14 }} />
        <StatusDot status={health.elasticsearch} />
      </div>
    </div>
  );
};

const LanguageSwitcher = () => {
  const { locale, localeLabels, locales, setLocale, t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLocale = (nextLocale) => {
    setLocale(nextLocale);
    setIsOpen(false);
  };

  return (
    <div className="language-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`language-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title={t('layout.controls.language')}
        aria-label={t('layout.controls.language')}
        aria-expanded={isOpen}
      >
        <GlobeAltIcon style={{ width: 18, height: 18 }} />
        <span>{localeLabels[locale]}</span>
        <ChevronDownIcon style={{ width: 16, height: 16 }} />
      </button>

      {isOpen && (
        <div className="language-menu animate-fade-in">
          {locales.map((supportedLocale) => (
            <button
              key={supportedLocale}
              type="button"
              className={`language-menu-item ${locale === supportedLocale ? 'active' : ''}`}
              onClick={() => handleSelectLocale(supportedLocale)}
            >
              {localeLabels[supportedLocale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Layout = () => {
  const { logout, user } = useAuth();
  const { t } = useLocalization();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.username ||
    'Admin';

  const displayRole = user?.role
    ? t(`common.roles.${user.role}`)
    : t('common.roles.analyst');

  const navItems = useMemo(
    () => [
      { key: 'dashboard', path: '/dashboard', icon: HomeIcon },
      { key: 'incidents', path: '/incidents', icon: ShieldExclamationIcon },
      { key: 'alerts', path: '/alerts', icon: BellIcon },
      { key: 'departments', path: '/departments', icon: BuildingOffice2Icon },
      { key: 'users', path: '/users', icon: UsersIcon },
      { key: 'settings', path: '/settings', icon: Cog6ToothIcon }
    ],
    []
  );

  const getPageTitle = () => {
    const currentItem = navItems.find((item) => item.path === location.pathname);
    return currentItem ? t(`layout.pages.${currentItem.key}`) : t('layout.pages.default');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
              <span>{t(`layout.pages.${item.key}`)}</span>
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
            <span>{t('common.actions.signOut')}</span>
          </button>
        </nav>
      </aside>

      <main className="main-area">
        <header className="top-nav">
          <h2 className="page-title">{getPageTitle()}</h2>

          <div className="nav-right">
            <SystemHealth />

            <LanguageSwitcher />

            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={t('layout.controls.toggleTheme')}
            >
              {theme === 'light' ? (
                <MoonIcon style={{ width: 20 }} />
              ) : (
                <SunIcon style={{ width: 20 }} />
              )}
            </button>

            <NotificationCenter onViewAll={() => navigate('/alerts')} />

            <div className="user-profile">
              <div className="user-avatar">{displayName.charAt(0).toUpperCase()}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{displayName}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {displayRole}
                </span>
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
