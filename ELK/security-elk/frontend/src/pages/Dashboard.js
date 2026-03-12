import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { 
  ShieldExclamationIcon, 
  BoltIcon, 
  CheckBadgeIcon, 
  ClockIcon 
} from '@heroicons/react/24/solid';
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
    {/* Decorative glow */}
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
    const interval = setInterval(fetchStats, 60000); // Auto refresh every minute
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

  const trendData = [
    { name: '00:00', val: 4 }, { name: '04:00', val: 7 }, { name: '08:00', val: 5 },
    { name: '12:00', val: 12 }, { name: '16:00', val: 8 }, { name: '20:00', val: 15 },
    { name: '23:59', val: 10 }
  ];

  if (loading) return <div className="loading">Đang phân tích hệ thống...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="dashboard-container">
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard 
          title="Total Incidents" 
          value={stats.overview.totalIncidents} 
          icon={ShieldExclamationIcon} 
          color="var(--accent-color)" 
        />
        <StatCard 
          title="Critical Threats" 
          value={stats.severity.critical} 
          icon={BoltIcon} 
          color="var(--color-critical)"
          trend={2}
        />
        <StatCard 
          title="Active Investigations" 
          value={stats.overview.investigatingIncidents} 
          icon={ClockIcon} 
          color="var(--color-medium)" 
        />
        <StatCard 
          title="Resolved" 
          value={stats.overview.resolvedIncidents} 
          icon={CheckBadgeIcon} 
          color="var(--color-low)" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Trend Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Threat Activity Trend (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="val" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={severityData} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={5}>
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
            {severityData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem' }}>Geographical Threat Map</h3>
        </div>
        <div style={{ height: 400, width: '100%', zIndex: 1 }}>
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
                  <div style={{ color: '#000' }}>
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
