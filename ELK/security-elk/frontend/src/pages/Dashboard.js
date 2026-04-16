import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Dialog, Transition } from '@headlessui/react';
import {
  BoltIcon,
  CheckBadgeIcon,
  ClockIcon,
  CpuChipIcon,
  ShieldExclamationIcon,
  UserMinusIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import 'leaflet/dist/leaflet.css';
import { useLocalization } from '../contexts/LocalizationContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, trend, onClick }) => (
  <div 
    className="card cursor-pointer group" 
    onClick={onClick}
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1.25rem', 
      position: 'relative', 
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}
  >
    <div
      style={{
        backgroundColor: `${color}15`,
        color,
        padding: '0.75rem',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.3s ease'
      }}
      className="group-hover:scale-110"
    >
      <Icon style={{ width: 28, height: 28 }} />
    </div>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{title}</p>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{value}</h3>
      {trend && <span style={{ fontSize: '0.75rem', color: trend.color, fontWeight: 600 }}>{trend.label}</span>}
    </div>
    <div
      style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '100px',
        height: '100px',
        background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`
      }}
    />
  </div>
);

const SecurityGauge = ({ score, label }) => {
  const data = [
    {
      name: 'Score',
      value: score,
      fill: score > 80 ? 'var(--color-low)' : score > 50 ? 'var(--color-medium)' : 'var(--color-critical)'
    }
  ];

  return (
    <div style={{ position: 'relative', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="60%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
          <RadialBar minAngle={15} background dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', bottom: '20%', textAlign: 'center' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{score}%</span>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>{label}</p>
      </div>
    </div>
  );
};

const CriticalBanner = ({ count, t, onClick }) => (
  <div 
    className="animate-pulse"
    style={{ 
      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
      border: '1px solid var(--color-critical)', 
      borderRadius: '12px', 
      padding: '0.75rem 1.25rem', 
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)'
    }}
    onClick={onClick}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <ShieldExclamationIcon style={{ width: 24, color: 'var(--color-critical)' }} />
      <div>
        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-critical)' }}>
          {t('dashboard.criticalAlertTitle') || 'CRITICAL INCIDENTS DETECTED'}
        </h4>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {t('dashboard.criticalAlertSubtitle', { count }) || `${count} unacknowledged critical incidents require immediate attention`}
        </p>
      </div>
    </div>
    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', backgroundColor: 'var(--color-critical)' }}>
      {t('common.actions.viewAll')}
    </button>
  </div>
);

const IntelModal = ({ isOpen, onClose, ipData, t, onBlock }) => {
  if (!ipData) return null;
  return (
    <Dialog open={isOpen} onClose={onClose} style={{ position: 'relative', zIndex: 1000 }}>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <Dialog.Panel className="card" style={{ width: '100%', maxWidth: '450px', padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <Dialog.Title style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{t('dashboard.attackerIntel') || 'Attacker Intelligence'}</Dialog.Title>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <XMarkIcon style={{ width: 24 }} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>SOURCE IP</p>
                <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-color)' }}>{ipData.ip}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>RISK LEVEL</p>
                <span className={`badge badge-${ipData.risk}`}>{t(`common.severity.${ipData.risk}`)}</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('dashboard.attackSummary') || 'Attack Summary'}</p>
              <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8125rem' }}>
                <p style={{ margin: '0 0 0.5rem' }}>• {t('dashboard.totalAttempts') || 'Total attempts detected'}: <strong>{ipData.count}</strong></p>
                <p style={{ margin: 0 }}>• {t('dashboard.firstSeen') || 'First seen'}: <strong>2 hours ago</strong></p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, backgroundColor: 'var(--color-critical)' }}
                onClick={() => { onBlock(ipData.ip); onClose(); }}
              >
                {t('common.actions.blockIp')}
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>{t('common.actions.cancel')}</button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const LiveBuzz = () => {
  const { alerts } = useSocket();
  const { formatTime, t } = useLocalization();
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [alerts]);

  return (
    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.875rem', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CpuChipIcon style={{ width: 16, color: 'var(--accent-color)' }} />
          {t('dashboard.liveEventBuzz')}
        </h3>
        <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>{t('common.status.streaming')}</span>
      </div>
      <div
        ref={scrollRef}
        style={{
          padding: '0.5rem',
          overflowY: 'auto',
          maxHeight: '300px',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          backgroundColor: 'rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}
      >
        {alerts.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('dashboard.waitingEvents')}</div>
        ) : (
          alerts.map((alert, index) => (
            <div
              key={`${alert.id || alert.createdAt}-${index}`}
              style={{
                padding: '0.4rem 0.6rem',
                borderLeft: `2px solid ${
                  alert.severity === 'critical' ? 'var(--color-critical)' : 'var(--accent-color)'
                }`,
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '2px',
                animation: 'slideIn 0.3s ease'
              }}
            >
              <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                [{formatTime(alert.createdAt || new Date().toISOString())}]
              </span>
              <span
                style={{
                  color:
                    alert.severity === 'critical'
                      ? 'var(--color-critical)'
                      : alert.severity === 'high'
                        ? 'var(--color-high)'
                        : 'var(--text-primary)',
                  fontWeight: 600
                }}
              >
                {alert.message || alert.title}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { formatDateTime, localizeApiMessage, t } = useLocalization();
  const { theme } = useTheme();
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [topAttackers, setTopAttackers] = useState([]);
  const [selectedIp, setSelectedIp] = useState(null);
  const [showHealthModal, setShowHealthModal] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, trendRes, attackersRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/dashboard/trend'),
        axios.get('/api/dashboard/top-attackers')
      ]);
      setStats(statsRes.data.data);
      setTrendData(trendRes.data.data);
      setTopAttackers(attackersRes.data.data);
      setError(null);
    } catch (err) {
      setError(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [localizeApiMessage]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    socket.on('incidentCreated', fetchStats);
    socket.on('incidentUpdated', fetchStats);

    return () => {
      socket.off('incidentCreated', fetchStats);
      socket.off('incidentUpdated', fetchStats);
    };
  }, [socket, fetchStats]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await axios.get('/api/dashboard/recent-incidents?limit=20');
        setRecent(res.data.data || []);
      } catch (err) {
        setRecent([]);
      }
    };

    fetchRecent();
  }, []);

  const severityData = useMemo(() => {
    if (!stats) {
      return [];
    }

    return [
      { name: t('common.severity.critical'), value: stats.severity.critical, color: '#ef4444' },
      { name: t('common.severity.high'), value: stats.severity.high, color: '#f97316' },
      { name: t('common.severity.medium'), value: stats.severity.medium, color: '#f59e0b' },
      { name: t('common.severity.low'), value: stats.severity.low, color: '#10b981' }
    ];
  }, [stats, t]);

  const securityScore = useMemo(() => {
    if (!stats) {
      return 100;
    }

    const penalty = stats.severity.critical * 15 + stats.severity.high * 8 + stats.severity.medium * 3;
    return Math.max(0, 100 - penalty);
  }, [stats]);

  const handleBlockIp = async (ip) => {
    try {
      await axios.post('/api/incidents/block-ip', { ip, reason: 'Dashboard Quick Block' });
      toast.success(t('incidents.blockSuccess', { ip }));
    } catch (err) {
      toast.error(t('common.errors.blockIpFailed'));
    }
  };

  if (loading) {
    return <div className="loading" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{t('dashboard.loading')}</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      {stats.severity.critical > 0 && (
        <CriticalBanner 
          count={stats.severity.critical} 
          t={t} 
          onClick={() => navigate('/incidents?severity=critical')} 
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <StatCard 
          title={t('dashboard.totalIncidents')} 
          value={stats.overview.totalIncidents} 
          icon={ShieldExclamationIcon} 
          color="var(--accent-color)" 
          onClick={() => navigate('/incidents')}
        />
        <div 
          className="card cursor-pointer" 
          onClick={() => setShowHealthModal(true)}
          style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, textAlign: 'center', marginBottom: '0.5rem' }}>{t('dashboard.securityPosture')}</p>
          <SecurityGauge score={securityScore} label={t('dashboard.systemHealthGauge')} />
        </div>
        <StatCard
          title={t('dashboard.activeInvestigations')}
          value={stats.overview.investigatingIncidents}
          icon={ClockIcon}
          color="var(--color-medium)"
          trend={{ color: 'var(--color-medium)', label: t('dashboard.sinceLastHour', { trend: '+2' }) }}
          onClick={() => navigate('/incidents?status=investigating')}
        />
        <StatCard 
          title={t('dashboard.systemResolved')} 
          value={stats.overview.resolvedIncidents} 
          icon={CheckBadgeIcon} 
          color="var(--color-low)" 
          onClick={() => navigate('/incidents?status=resolved')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BoltIcon style={{ width: 18, color: 'var(--accent-color)' }} />
            {t('dashboard.threatTrend')}
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px' }} itemStyle={{ color: 'var(--text-primary)' }} />
              <Area type="monotone" dataKey="val" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserMinusIcon style={{ width: 18, color: 'var(--color-critical)' }} />
            {t('dashboard.topAttackers')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topAttackers.map((attacker) => (
              <div 
                key={attacker.ip} 
                className="cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setSelectedIp(attacker)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{attacker.ip}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('dashboard.attemptsDetected', { count: attacker.count })}</span>
                </div>
                <span className={`badge badge-${attacker.risk}`} style={{ fontSize: '0.65rem' }}>{t(`common.severity.${attacker.risk}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <boltIcon style={{ width: 18, color: 'var(--accent-color)' }} />
            {t('dashboard.severityMatrix')}
          </h3>
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie 
                  data={severityData} 
                  dataKey="value" 
                  innerRadius={65} 
                  outerRadius={85} 
                  paddingAngle={5}
                  stroke="none"
                  onClick={(data) => {
                    const sev = data.name.toLowerCase();
                    navigate(`/incidents?severity=${sev}`);
                  }}
                  className="cursor-pointer"
                >
                  {severityData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.2))' }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    borderColor: 'var(--border-color)', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text for Donut */}
            <div style={{ 
              position: 'absolute', 
              top: '46%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, display: 'block', color: 'var(--text-primary)' }}>
                {stats.overview.totalIncidents}
              </span>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('common.table.total') || 'Total'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {severityData.map((severity) => (
              <button 
                key={severity.name} 
                onClick={() => navigate(`/incidents?severity=${severity.name.toLowerCase()}`)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  fontSize: '0.75rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background 0.2s'
                }}
                className="hover:bg-white/5"
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: severity.color }} />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{severity.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({severity.value})</span>
              </button>
            ))}
          </div>
        </div>

        <LiveBuzz />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', margin: 0 }}>{t('dashboard.geographicalMap')}</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-medium">{t('dashboard.localizationOn')}</span>
          </div>
        </div>
        <div style={{ height: 350, width: '100%', zIndex: 1 }}>
          <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', background: 'var(--bg-primary)' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={theme === 'dark' ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}
            />
            {recent.filter((incident) => incident.location?.coordinates?.lat).map((incident) => (
              <Marker key={incident._id} position={[incident.location.coordinates.lat, incident.location.coordinates.lng]}>
                <Popup>
                  <div style={{ color: '#000', fontSize: '0.8rem' }}>
                    <strong>{incident.title}</strong>
                    <br />
                    {t('dashboard.popupSeverity')}: {t(`common.severity.${incident.severity}`)}
                    <br />
                    {formatDateTime(incident.createdAt)}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <IntelModal 
        isOpen={!!selectedIp} 
        onClose={() => setSelectedIp(null)} 
        ipData={selectedIp} 
        t={t}
        onBlock={handleBlockIp}
      />

      <Dialog open={showHealthModal} onClose={() => setShowHealthModal(false)} style={{ position: 'relative', zIndex: 1000 }}>
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <Dialog.Panel className="card" style={{ width: '100%', maxWidth: '450px', padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <Dialog.Title style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{t('dashboard.securityHealthReport') || 'Security Health Report'}</Dialog.Title>
              <button onClick={() => setShowHealthModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: 24 }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: securityScore > 80 ? 'var(--color-low)' : 'var(--color-critical)' }}>{securityScore}%</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Overall System Health Score</p>
              </div>
              <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <h5 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem' }}>Active Risk Factors</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span>Critical Incidents</span>
                    <span style={{ color: 'var(--color-critical)', fontWeight: 700 }}>-{stats.severity.critical * 15} pts</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span>High Severity Incidents</span>
                    <span style={{ color: 'var(--color-high)', fontWeight: 700 }}>-{stats.severity.high * 8} pts</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => setShowHealthModal(false)}>{t('common.actions.viewAll')}</button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default Dashboard;
