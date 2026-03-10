import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Analyst', value: 'analyst' },
  { label: 'Viewer', value: 'viewer' }
];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (roleFilter) params.role = roleFilter;
      if (activeFilter) params.isActive = activeFilter;
      const res = await axios.get('/api/auth/users', { params });
      setUsers(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [page, limit, roleFilter, activeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onUpdateUser = async (id, updates) => {
    try {
      await axios.put(`/api/auth/users/${id}`, updates);
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const rows = useMemo(() => users, [users]);

  return (
    <div>
      <h2>Người dùng</h2>
      <div className="card" style={{ marginBottom: 12, padding: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">Tất cả vai trò</option>
            {roleOptions.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)}>
            <option value="">Trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Bị khóa</option>
          </select>
          <button onClick={() => { setPage(1); fetchUsers(); }}>Lọc</button>
        </div>
      </div>

      {loading && <div className="card">Đang tải...</div>}
      {error && <div className="card" style={{ color: 'red' }}>{error}</div>}

      {!loading && !error && (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Email</th>
                <th style={{ padding: 8 }}>Tên</th>
                <th style={{ padding: 8 }}>Role</th>
                <th style={{ padding: 8 }}>Phòng ban</th>
                <th style={{ padding: 8 }}>Trạng thái</th>
                <th style={{ padding: 8 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8 }}>{u.firstName} {u.lastName}</td>
                  <td style={{ padding: 8 }}>
                    <select value={u.role} onChange={e => onUpdateUser(u.id, { role: e.target.value })}>
                      {roleOptions.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: 8 }}>{u.department || '-'}</td>
                  <td style={{ padding: 8 }}>
                    <input
                      type="checkbox"
                      checked={u.isActive}
                      onChange={e => onUpdateUser(u.id, { isActive: e.target.checked })}
                    />
                  </td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => onUpdateUser(u.id, { department: prompt('Nhập phòng ban mới', u.department || '') })}>
                      Sửa phòng ban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trang trước</button>
            <span>Trang {page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Trang sau</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
