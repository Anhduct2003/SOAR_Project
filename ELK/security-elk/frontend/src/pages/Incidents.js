import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  NoSymbolIcon,
  BellSlashIcon,
  UserCircleIcon,
  EyeIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    sinceHours: 24,
    q: '',
    page: 1,
    sortBy: 'createdAt',
    sortDir: 'desc'
  });
  
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);

  const fetchIncidents = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = { 
        limit: 15, 
        sortBy: filters.sortBy, 
        sortDir: filters.sortDir,
        page: filters.page
      };
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      if (filters.sinceHours) params.since = new Date(Date.now() - filters.sinceHours * 3600 * 1000).toISOString();
      if (filters.q) params.q = filters.q;
      
      const res = await axios.get('/api/incidents', { 
        params, 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      if (res.data && res.data.data) {
        setIncidents(res.data.data.map(i => ({ id: i._id || i.id, ...i })));
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    const timer = setTimeout(fetchIncidents, 300);
    return () => clearTimeout(timer);
  }, [fetchIncidents]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  };

  const handleBlockIP = async (ip) => {
    const reason = prompt(`Chặn IP ${ip}? Nhập lý do:`, 'Manual block from incident list');
    if (!reason) return;
    try {
      await axios.post('/api/incidents/block-ip', { ip, reason }, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      alert(`Đã chặn IP ${ip}`);
    } catch (e) {
      alert(e.response?.data?.message || 'Chặn IP thất bại');
    }
    setActiveMenu(null);
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Severity', 'Status', 'Category', 'Detected At', 'IPs'];
    const rows = incidents.map(i => [
      i.title, i.severity, i.status, i.category, 
      new Date(i.detectedAt).toLocaleString(),
      (i.ipAddresses || []).join(' ')
    ].map(v => `"${v}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incidents_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="incidents-page">
      {/* Search and Filters Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search incidents..." 
              value={filters.q}
              onChange={e => handleFilterChange('q', e.target.value)}
              style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FunnelIcon style={{ width: 18, color: 'var(--text-secondary)' }} />
              <select 
                value={filters.severity} 
                onChange={e => handleFilterChange('severity', e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              >
                <option value="">All Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <select 
              value={filters.status} 
              onChange={e => handleFilterChange('status', e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="contained">Contained</option>
              <option value="resolved">Resolved</option>
            </select>

            <button className="btn btn-primary" onClick={handleExportCSV}>
              <ArrowDownTrayIcon style={{ width: 18 }} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="card" style={{ padding: 0, overflow: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem 1.5rem', width: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={incidents.length > 0 && incidents.every(i => selected[i.id])}
                  onChange={e => {
                    const checked = e.target.checked;
                    const newSelected = {};
                    incidents.forEach(i => newSelected[i.id] = checked);
                    setSelected(newSelected);
                  }}
                />
              </th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>TITLE</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>SEVERITY</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>STATUS</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>DETECTED AT</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'right' }}>RESPONSE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Phân tích dữ liệu...</td></tr>
            ) : incidents.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Không có sự cố nào khớp với bộ lọc.</td></tr>
            ) : incidents.map(incident => (
              <tr key={incident.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={!!selected[incident.id]}
                    onChange={e => setSelected(prev => ({ ...prev, [incident.id]: e.target.checked }))}
                  />
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{incident.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{incident.category} • {(incident.ipAddresses || []).join(', ')}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span className={`badge badge-${incident.severity}`}>
                    {incident.severity}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: incident.status === 'resolved' ? 'var(--color-low)' : 'var(--color-medium)' }} />
                    {incident.status}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {new Date(incident.detectedAt).toLocaleString()}
                </td>
                <td style={{ padding: '1rem 1.5rem', textAlign: 'right', position: 'relative' }}>
                  <button 
                    onClick={() => setActiveMenu(activeMenu === incident.id ? null : incident.id)}
                    className="btn" 
                    style={{ padding: '0.4rem', color: 'var(--text-secondary)' }}
                  >
                    <EllipsisVerticalIcon style={{ width: 22 }} />
                  </button>
                  
                  {activeMenu === incident.id && (
                    <div style={{ 
                      position: 'absolute', 
                      right: '1rem', 
                      top: '3rem', 
                      backgroundColor: 'var(--bg-surface)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                      zIndex: 100,
                      minWidth: '180px',
                      overflow: 'hidden'
                    }}>
                      <button className="menu-item" style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        <EyeIcon style={{ width: 16 }} /> View Details
                      </button>
                      <button 
                        onClick={() => handleBlockIP(incident.ipAddresses?.[0])}
                        className="menu-item" 
                        style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-critical)' }}
                      >
                        <NoSymbolIcon style={{ width: 16 }} /> Block IP
                      </button>
                      <button className="menu-item" style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        <BellSlashIcon style={{ width: 16 }} /> Mute Alert
                      </button>
                      <button className="menu-item" style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer', borderTop: '1px solid var(--border-color)', color: 'var(--accent-color)' }}>
                        <UserCircleIcon style={{ width: 16 }} /> Assign to Me
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination bar */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.01)' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Showing <strong>{incidents.length}</strong> incidents
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              disabled={filters.page <= 1} 
              onClick={() => handleFilterChange('page', filters.page - 1)}
              className="btn" 
              style={{ padding: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
            >
              <ChevronLeftIcon style={{ width: 16 }} />
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.875rem' }}>
              Page {filters.page} of {totalPages}
            </span>
            <button 
              disabled={filters.page >= totalPages} 
              onClick={() => handleFilterChange('page', filters.page + 1)}
              className="btn" 
              style={{ padding: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
            >
              <ChevronRightIcon style={{ width: 16 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Incidents;
