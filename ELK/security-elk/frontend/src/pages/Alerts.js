import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { 
  ArrowDownTrayIcon, 
  FunnelIcon, 
  ClockIcon,
  BellAlertIcon 
} from '@heroicons/react/24/outline';

const Alerts = () => {
  const { alerts: realtimeAlerts } = useSocket();
  const [apiAlerts, setApiAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    severity: 'high,critical',
    sinceHours: 24
  });

  const mergedAlerts = useMemo(() => {
    const map = new Map();
    [...realtimeAlerts, ...apiAlerts].forEach(a => {
      const key = a.id || `${a.type}-${a.createdAt}-${a.title}`;
      if (!map.has(key)) map.set(key, a);
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [realtimeAlerts, apiAlerts]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const since = new Date(Date.now() - filters.sinceHours * 60 * 60 * 1000).toISOString();
        const res = await axios.get('/api/alerts', { 
          params: { severity: filters.severity, limit: 100, since } 
        });
        setApiAlerts(res.data.data || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Không thể tải alerts');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [filters]);

  const handleExportCSV = () => {
    const headers = ['Title', 'Severity', 'Status', 'Category', 'Source', 'Created At'];
    const rows = mergedAlerts.map(a => [
      a.title || a.message,
      a.severity,
      a.status || 'N/A',
      a.category || 'N/A',
      a.source || 'ELK',
      new Date(a.createdAt).toLocaleString()
    ].map(v => `"${v}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alerts_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="alerts-page">
      {/* Filters Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FunnelIcon style={{ width: 18, color: 'var(--text-muted)' }} />
              <select 
                value={filters.severity} 
                onChange={e => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              >
                <option value="high,critical">High + Critical</option>
                <option value="medium,high,critical">Medium + High + Critical</option>
                <option value="low,medium,high,critical">All Severity</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClockIcon style={{ width: 18, color: 'var(--text-muted)' }} />
              <select 
                value={filters.sinceHours} 
                onChange={e => setFilters(prev => ({ ...prev, sinceHours: parseInt(e.target.value) }))}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              >
                <option value={1}>Last 1 hour</option>
                <option value={6}>Last 6 hours</option>
                <option value={24}>Last 24 hours</option>
                <option value={168}>Last 7 days</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleExportCSV}>
            <ArrowDownTrayIcon style={{ width: 18 }} />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Mã hóa dữ liệu cảnh báo...</div>
      ) : mergedAlerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <BellAlertIcon style={{ width: 48, margin: '0 auto 1rem', opacity: 0.2 }} />
          <p>Hệ thống an toàn. Không phát hiện cảnh báo nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mergedAlerts.map((alert, idx) => (
            <div key={alert.id || idx} className="card animate-fade-in" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ 
                    marginTop: '0.25rem',
                    width: 10, height: 10, borderRadius: '50%', 
                    backgroundColor: alert.severity === 'critical' || alert.severity === 'high' ? 'var(--color-critical)' : 'var(--color-medium)',
                    boxShadow: `0 0 10px ${alert.severity === 'critical' ? 'var(--color-critical)' : 'transparent'}`
                  }} />
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{alert.title || alert.message}</h4>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                      {alert.category && <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>• {alert.category}</span>}
                      {alert.source && <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>• {alert.source}</span>}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
