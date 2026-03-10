import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

const Alerts = () => {
  const { alerts: realtimeAlerts } = useSocket();
  const [apiAlerts, setApiAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severity, setSeverity] = useState('high,critical');
  const [sinceHours, setSinceHours] = useState(24);

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
        const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();
        const res = await axios.get('/api/alerts', { params: { severity, limit: 100, since } });
        setApiAlerts(res.data.data || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Không thể tải alerts');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [severity, sinceHours]);

  return (
    <div>
      <h2>Cảnh báo</h2>
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label>
            Severity:
            <select value={severity} onChange={e => setSeverity(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="high,critical">High + Critical</option>
              <option value="medium,high,critical">Medium + High + Critical</option>
              <option value="low,medium,high,critical">Tất cả</option>
            </select>
          </label>
          <label>
            Thời gian:
            <select value={sinceHours} onChange={e => setSinceHours(parseInt(e.target.value))} style={{ marginLeft: 8 }}>
              <option value={1}>1 giờ</option>
              <option value={6}>6 giờ</option>
              <option value={12}>12 giờ</option>
              <option value={24}>24 giờ</option>
              <option value={72}>3 ngày</option>
              <option value={168}>7 ngày</option>
            </select>
          </label>
          <button onClick={() => {
            const headers = ['title','severity','status','category','source','createdAt'];
            const rows = mergedAlerts.map(a => headers.map(h => (a[h] ?? '')).join(','));
            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `alerts_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }}>Export CSV</button>
        </div>
      </div>
      {loading && <div className="card">Đang tải...</div>}
      {error && <div className="card" style={{ color: 'red' }}>{error}</div>}
      {!loading && mergedAlerts.length === 0 && (
        <div className="card">Chưa có cảnh báo.</div>
      )}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {mergedAlerts.map((a, idx) => (
          <li key={a.id || idx} className="card" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{a.title || a.message}</strong>
              <span>{new Date(a.createdAt).toLocaleString()}</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{ textTransform: 'uppercase' }}>{a.severity}</span>
              {a.category && <span> • {a.category}</span>}
              {a.status && <span> • {a.status}</span>}
              {a.source && <span> • {a.source}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Alerts;
