import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar, Legend
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { 
  ShieldExclamationIcon, 
  BoltIcon, 
  CheckBadgeIcon, 
  ClockIcon,
  UserMinusIcon,
  ShieldCheckIcon,
  CpuChipIcon
} from '@heroicons/react/24/solid';
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
    <div style={{ 
      backgroundColor: `${color}15`, 
      color: color, 
      padding: '0.75rem', 
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Icon style={{ width: 28, height: 28 }} />
    </div>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{title}</p>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{value}</h3>
      {trend && (
        <span style={{ fontSize: '0.75rem', color: trend > 0 ? 'var(--color-critical)' : 'var(--color-low)', fontWeight: 600 }}>
          {trend > 0 ? '+' : ''}{trend} since last hour
        </span>
      )}
    </div>
    <div style={{ 
      position: 'absolute', 
      top: '-20%', 
      right: '-10%', 
      width: '100px', 
      height: '100px', 
      background: `radial-gradient(circle, ${color}10 0%, transparent 70%)` 
    }} />
  </div>
);

const SecurityGauge = ({ score }) => {
  const data = [{ name: 'Score', value: score, fill: score > 80 ? 'var(--color-low)' : score > 50 ? 'var(--color-medium)' : 'var(--color-critical)' }];
  
  return (
    <div style={{ position: 'relative', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          innerRadius="60%" 
          outerRadius="100%" 
          data={data} 
          startAngle={180} 
          endAngle={0}
        >
          <RadialBar minAngle={15} background dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', bottom: '20%', textAlign: 'center' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{score}%</span>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>SYSTEM HEALTH</p>
      </div>
    </div>
  );
};

const LiveBuzz = () => {
  const { alerts } = useSocket();
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
          LIVE EVENT BUZZ
        </h3>
        <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>STREAMING</span>
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
          <div style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>Waiting for system events...</div>
        ) : (
          alerts.map((alert, i) => (
            <div key={i} style={{ 
              padding: '0.4rem 0.6rem', 
              borderLeft: `2px solid ${alert.severity === 'critical' ? 'var(--color-critical)' : 'var(--accent-color)'}`,
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '2px',
              animation: 'slideIn 0.3s ease'
            }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>[{new Date(alert.createdAt).toLocaleTimeString()}]</span>
              <span style={{ 
                color: alert.severity === 'critical' ? 'var(--color-critical)' : alert.severity === 'high' ? 'var(--color-high)' : 'var(--text-primary)',
                fontWeight: 600 
              }}>
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
  const { theme } = useTheme();
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('/api/dashboard/stats');
      setStats(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    if (!socket) return;
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
      } catch (e) {}
    };
    fetchRecent();
  }, []);

  const severityData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Critical', value: stats.severity.critical, color: '#ef4444' },
      { name: 'High', value: stats.severity.high, color: '#f97316' },
      { name: 'Medium', value: stats.severity.medium, color: '#f59e0b' },
      { name: 'Low', value: stats.severity.low, color: '#10b981' }
    ];
  }, [stats]);

  const securityScore = useMemo(() => {
    if (!stats) return 100;
    const penalty = (stats.severity.critical * 15) + (stats.severity.high * 8) + (stats.severity.medium * 3);
    return Math.max(0, 100 - penalty);
  }, [stats]);

  const trendData = [
    { name: '00:00', val: 4 }, { name: '04:00', val: 7 }, { name: '08:00', val: 5 },
    { name: '12:00', val: 12 }, { name: '16:00', val: 8 }, { name: '20:00', val: 15 },
    { name: '23:59', val: 10 }
  ];

  const topAttackers = [
    { ip: '192.168.1.45', count: 142, risk: 'High' },
    { ip: '45.12.33.190', count: 89, risk: 'Critical' },
    { ip: '10.0.5.22', count: 64, risk: 'Medium' },
    { ip: '172.16.0.12', count: 31, risk: 'Low' },
  ];

  if (loading) return <div className="loading" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>VERIFYING SYSTEM INTEGRITY...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="dashboard-container">
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <StatCard 
          title="Total Incidents" 
          value={stats.overview.totalIncidents} 
          icon={ShieldExclamationIcon} 
          color="var(--accent-color)" 
        />
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, textAlign: 'center', marginBottom: '0.5rem' }}>Security Posture</p>
          <SecurityGauge score={securityScore} />
        </div>
        <StatCard 
          title="Active Investigations" 
          value={stats.overview.investigatingIncidents} 
          icon={ClockIcon} 
          color="var(--color-medium)" 
        />
        <StatCard 
          title="System Resolved" 
          value={stats.overview.resolvedIncidents} 
          icon={CheckBadgeIcon} 
          color="var(--color-low)" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Trend Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BoltIcon style={{ width: 18, color: 'var(--accent-color)' }} />
            Threat Activity Trend (24h)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="val" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Attacker Analysis */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserMinusIcon style={{ width: 18, color: 'var(--color-critical)' }} />
            Top Attacker Analysis
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topAttackers.map((atk, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{atk.ip}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{atk.count} attempts detected</span>
                </div>
                <span className={`badge badge-${atk.risk.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{atk.risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Severity Distribution */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Severity Matrix</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={severityData} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={5}>
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            {severityData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Live Buzz Panel */}
        <LiveBuzz />
      </div>

      {/* Map Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Geographical Threat Map</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-medium">LOCALIZATION: ON</span>
          </div>
        </div>
        <div style={{ height: 350, width: '100%', zIndex: 1 }}>
          <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', background: 'var(--bg-primary)' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={theme === 'dark' 
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
                : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
              }
            />
            {recent.filter(i => i.location?.coordinates?.lat).map((incident) => (
              <Marker 
                key={incident._id} 
                position={[incident.location.coordinates.lat, incident.location.coordinates.lng]}
              >
                <Popup>
                  <div style={{ color: '#000', fontSize: '0.8rem' }}>
                    <strong>{incident.title}</strong><br/>
                    Severity: {incident.severity}<br/>
                    {new Date(incident.createdAt).toLocaleString()}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
