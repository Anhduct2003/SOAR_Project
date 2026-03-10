import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
// Kiểm tra xem date-fns đã được cài đặt chưa
// import { format } from 'date-fns';

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [sinceHours, setSinceHours] = useState(24);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState({});

  // Fetch incidents on component mount
  useEffect(() => {
    const fetchIncidents = async () => {
      if (!token) {
        console.log('Không có token, không thể gửi request');
        setError('Vui lòng đăng nhập lại để xem sự cố');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Đang gửi yêu cầu đến API với token:', token ? 'Token hợp lệ' : 'Không có token');
        
        const params = { limit, sortBy, sortDir };
        if (severity) params.severity = severity;
        if (status) params.status = status;
        if (sinceHours) params.since = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString();
        if (page) params.page = page;
        if (qDebounced) params.q = qDebounced;
        
        const response = await axios.get('/api/incidents', { params, headers: { 'Authorization': `Bearer ${token}` } });
        
        console.log('Dữ liệu nhận được từ API:', response.data);
        
        // Kiểm tra cấu trúc dữ liệu trả về
        if (response.data && response.data.data) {
          const list = response.data.data.map(i => ({ id: i._id || i.id, ...i }));
          setIncidents(list);
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.pages || 1);
          }
          console.log('Số lượng sự cố:', response.data.data.length);
        } else {
          console.log('Định dạng dữ liệu không như mong đợi:', response.data);
          setIncidents([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching incidents:', error);
        console.error('Error details:', error.response?.data || error.message || 'Không có chi tiết lỗi');
        console.error('Error status:', error.response?.status);
        setError('Không thể tải danh sách sự cố: ' + (error.message || 'Lỗi không xác định'));
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [token, severity, status, sinceHours, page, limit, qDebounced]);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  // Get severity class for styling
  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'low':
        return 'severity-low';
      case 'medium':
        return 'severity-medium';
      case 'high':
        return 'severity-high';
      case 'critical':
        return 'severity-critical';
      default:
        return '';
    }
  };

  // Get status class for styling
  const getStatusClass = (status) => {
    switch (status) {
      case 'open':
        return 'status-open';
      case 'investigating':
        return 'status-investigating';
      case 'contained':
        return 'status-contained';
      case 'resolved':
        return 'status-resolved';
      case 'closed':
        return 'status-closed';
      default:
        return '';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      // Sử dụng Date trực tiếp thay vì format từ date-fns
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN');
    } catch (error) {
      return dateString || 'N/A';
    }
  };

  if (loading) {
    return (
      <div>
        <h2>Danh sách sự cố</h2>
        <div className="card">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2>Danh sách sự cố</h2>
        <div className="card error">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h2>Danh sách sự cố</h2>
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input placeholder="Tìm kiếm (tiêu đề/mô tả/danh mục)" value={q} onChange={e => { setPage(1); setQ(e.target.value); }} style={{ minWidth: 240 }} />
          <label>
            Sắp xếp:
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="createdAt">Thời gian tạo</option>
              <option value="detectedAt">Thời gian phát hiện</option>
              <option value="severity">Mức độ</option>
              <option value="status">Trạng thái</option>
              <option value="category">Danh mục</option>
            </select>
            <select value={sortDir} onChange={e => setSortDir(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </label>
        </div>
      </div>
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label>
            Severity:
            <select value={severity} onChange={e => { setPage(1); setSeverity(e.target.value); }} style={{ marginLeft: 8 }}>
              <option value="">Tất cả</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label>
            Status:
            <select value={status} onChange={e => { setPage(1); setStatus(e.target.value); }} style={{ marginLeft: 8 }}>
              <option value="">Tất cả</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="contained">Contained</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label>
            Thời gian:
            <select value={sinceHours} onChange={e => { setPage(1); setSinceHours(parseInt(e.target.value)); }} style={{ marginLeft: 8 }}>
              <option value={1}>1 giờ</option>
              <option value={6}>6 giờ</option>
              <option value={12}>12 giờ</option>
              <option value={24}>24 giờ</option>
              <option value={72}>3 ngày</option>
              <option value={168}>7 ngày</option>
            </select>
          </label>
          <button onClick={() => {
            const headers = ['title','severity','status','category','detectedAt','createdAt','ipAddresses'];
            const rows = incidents.map(a => headers.map(h => {
              const v = a[h];
              if (Array.isArray(v)) return '"' + v.join(' ') + '"';
              return (v ?? '');
            }).join(','));
            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `incidents_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }}>Export CSV</button>
        </div>
      </div>
      
      {/* Panel thông tin debug */}
      <div className="debug-panel">
        <h3>Thông tin debug</h3>
        <div className="debug-info">
          <p><strong>Trạng thái:</strong> {loading ? 'Đang tải...' : error ? 'Lỗi' : incidents.length > 0 ? 'Đã tải xong' : 'Không có dữ liệu'}</p>
          <p><strong>Token:</strong> {token ? 'Hợp lệ' : 'Không có hoặc không hợp lệ'}</p>
          <p><strong>Số sự cố:</strong> {incidents.length}</p>
          {error && <p className="error-message"><strong>Lỗi:</strong> {error}</p>}
        </div>
      </div>
      
      <style jsx="true">{`
        .debug-panel {
          background-color: #182235;
          border: 1px solid #2d3748;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .debug-panel h3 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #a0aec0;
          font-size: 16px;
        }
        
        .debug-info {
          font-family: monospace;
          line-height: 1.5;
        }
        
        .error-message {
          color: #f56565;
        }
        
        .incidents-list table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .incidents-list th, .incidents-list td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #2d3748;
        }
        .incidents-list th {
          background-color: #1a202c;
          color: white;
        }
        .incidents-list tr:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        .badge {
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .severity-low { background-color: #68d391; color: #22543d; }
        .severity-medium { background-color: #f6ad55; color: #7b341e; }
        .severity-high { background-color: #fc8181; color: #742a2a; }
        .severity-critical { background-color: #b794f4; color: #44337a; }
        
        .status-open { background-color: #fc8181; color: #742a2a; }
        .status-investigating { background-color: #f6ad55; color: #7b341e; }
        .status-contained { background-color: #63b3ed; color: #2c5282; }
        .status-resolved { background-color: #68d391; color: #22543d; }
        .status-closed { background-color: #cbd5e0; color: #1a202c; }
      `}</style>
      
      {incidents.length === 0 ? (
        <div className="card">Không có sự cố nào.</div>
      ) : (
        <div className="incidents-list">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" checked={incidents.length > 0 && incidents.every(i => selected[i.id])} onChange={e => {
                  const checked = e.target.checked; const map = {}; incidents.forEach(i => { map[i.id] = checked; }); setSelected(map);
                }} /></th>
                <th>Tiêu đề</th>
                <th>Mức độ</th>
                <th>Trạng thái</th>
                <th>Danh mục</th>
                <th>Thời gian phát hiện</th>
                <th>IP tấn công</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id}>
                  <td><input type="checkbox" checked={!!selected[incident.id]} onChange={e => setSelected(prev => ({ ...prev, [incident.id]: e.target.checked }))} /></td>
                  <td>{incident.title}</td>
                  <td>
                    <span className={`badge ${getSeverityClass(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusClass(incident.status)}`}>
                      {incident.status}
                    </span>
                  </td>
                  <td>{incident.category}</td>
                  <td>{formatDate(incident.detectedAt)}</td>
                  <td>
                    {(incident.ipAddresses || []).join(', ') || 'N/A'}
                    {(incident.ipAddresses && incident.ipAddresses.length > 0) && (
                      <button style={{ marginLeft: 8 }} onClick={async () => {
                        const ip = incident.ipAddresses[0];
                        const reason = prompt(`Chặn IP ${ip}? Nhập lý do (tuỳ chọn):`, 'auto-block from dashboard');
                        try {
                          const token = localStorage.getItem('token');
                          await axios.post('/api/incidents/block-ip', { ip, reason }, { headers: { 'Authorization': `Bearer ${token}` } });
                          alert(`Đã chặn IP ${ip}`);
                        } catch (e) {
                          alert(e.response?.data?.message || 'Chặn IP thất bại');
                        }
                      }}>Chặn IP</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 12 }}>
            <span>Bulk cập nhật trạng thái:</span>
            <select id="bulk-status">
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="contained">Contained</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button onClick={async () => {
              const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
              if (ids.length === 0) return alert('Chưa chọn bản ghi');
              const statusValue = document.getElementById('bulk-status').value;
              try {
                await axios.put('/api/incidents/bulk-status', { ids, status: statusValue }, { headers: { 'Authorization': `Bearer ${token}` } });
                setSelected({});
                // trigger reload
                const params = { limit, sortBy, sortDir };
                if (severity) params.severity = severity;
                if (status) params.status = status;
                if (sinceHours) params.since = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString();
                if (page) params.page = page;
                if (q) params.q = q;
                const response = await axios.get('/api/incidents', { params, headers: { 'Authorization': `Bearer ${token}` } });
                const list = response.data.data.map(i => ({ id: i._id || i.id, ...i }));
                setIncidents(list);
              } catch (e) {
                alert(e.response?.data?.message || 'Bulk update thất bại');
              }
            }}>Áp dụng</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trang trước</button>
            <span>Trang {page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Trang sau</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents;
