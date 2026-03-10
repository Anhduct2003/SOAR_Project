import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    openIncidents: 0,
    resolvedIncidents: 0,
    investigatingIncidents: 0,
    containedIncidents: 0,
    severity: { low: 0, medium: 0, high: 0, critical: 0 },
    todayIncidents: 0,
    recentIncidents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket } = useSocket();
  const [recent, setRecent] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/dashboard/stats');
      const d = res.data.data;
      setStats({
        totalIncidents: d.overview.totalIncidents,
        openIncidents: d.overview.openIncidents,
        resolvedIncidents: d.overview.resolvedIncidents,
        investigatingIncidents: d.overview.investigatingIncidents,
        containedIncidents: d.overview.containedIncidents,
        severity: d.severity,
        todayIncidents: d.trends.today,
        recentIncidents: d.trends.last24Hours
      });
      setError(null);
    } catch (err) {
      setError('Lỗi tải dữ liệu: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!socket) return;
    const onCreated = () => fetchStats();
    const onUpdated = () => fetchStats();
    socket.on('incidentCreated', onCreated);
    socket.on('incidentUpdated', onUpdated);
    return () => {
      socket.off('incidentCreated', onCreated);
      socket.off('incidentUpdated', onUpdated);
    };
  }, [socket, fetchStats]);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await axios.get('/api/dashboard/recent-incidents?limit=50');
      setRecent(res.data.data || []);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const severityData = useMemo(() => ([
    { name: 'Low', value: stats.severity.low, color: '#2ca02c' },
    { name: 'Medium', value: stats.severity.medium, color: '#ffbf00' },
    { name: 'High', value: stats.severity.high, color: '#ff7f0e' },
    { name: 'Critical', value: stats.severity.critical, color: '#d62728' }
  ]), [stats.severity]);

  const statusData = useMemo(() => ([
    { name: 'Open', value: stats.openIncidents },
    { name: 'Investigating', value: stats.investigatingIncidents },
    { name: 'Contained', value: stats.containedIncidents },
    { name: 'Resolved', value: stats.resolvedIncidents }
  ]), [stats]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Security Dashboard</h2>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Security Dashboard</h2>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Security Dashboard</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '2em', margin: '0 0 10px 0' }}>{stats.totalIncidents}</h3>
          <p>Tổng sự cố</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8d7da', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '2em', margin: '0 0 10px 0' }}>{stats.openIncidents}</h3>
          <p>Sự cố mở</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8d7da', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '2em', margin: '0 0 10px 0' }}>{stats.severity.critical}</h3>
          <p>Nghiêm trọng</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#d1edff', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '2em', margin: '0 0 10px 0' }}>{stats.resolvedIncidents}</h3>
          <p>Đã giải quyết</p>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <p>Trong ngày: {stats.todayIncidents} • 24h gần nhất: {stats.recentIncidents}</p>
        <p>Severity khác: Low {stats.severity.low} • Medium {stats.severity.medium} • High {stats.severity.high}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 20 }}>
        <div className="card" style={{ padding: 12 }}>
          <h3>Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie dataKey="value" data={severityData} outerRadius={80} label>
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: 12 }}>
          <h3>Status Overview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Bản đồ sự cố gần đây</h3>
        <div style={{ height: 360, width: '100%' }}>
          <MapContainer center={[21.0278, 105.8342]} zoom={3} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {recent.filter(i => i.location && i.location.coordinates && i.location.coordinates.lat && i.location.coordinates.lng).map((i, idx) => (
              <Marker key={i.id || idx} position={[i.location.coordinates.lat, i.location.coordinates.lng]}>
                <Popup>
                  <div>
                    <strong>{i.title}</strong>
                    <div>Severity: {i.severity}</div>
                    <div>Status: {i.status}</div>
                    <div>Category: {i.category}</div>
                    <div>{new Date(i.createdAt).toLocaleString()}</div>
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
