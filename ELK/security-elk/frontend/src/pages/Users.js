import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocalization } from '../contexts/LocalizationContext';

const Users = () => {
  const { localizeApiMessage, t } = useLocalization();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const roleOptions = useMemo(
    () => [
      { label: t('common.roles.admin'), value: 'admin' },
      { label: t('common.roles.analyst'), value: 'analyst' },
      { label: t('common.roles.viewer'), value: 'viewer' }
    ],
    [t]
  );

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit };
      if (roleFilter) {
        params.role = roleFilter;
      }
      if (activeFilter) {
        params.isActive = activeFilter;
      }
      const res = await axios.get('/api/auth/users', { params });
      setUsers(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      setError(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.usersLoad'));
    } finally {
      setLoading(false);
    }
  }, [activeFilter, limit, localizeApiMessage, page, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onUpdateUser = async (id, updates) => {
    try {
      await axios.put(`/api/auth/users/${id}`, updates);
      fetchUsers();
    } catch (err) {
      window.alert(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.updateFailed'));
    }
  };

  return (
    <div>
      <h2>{t('users.title')}</h2>
      <div className="card" style={{ marginBottom: 12, padding: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">{t('common.labels.allRoles')}</option>
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
            <option value="">{t('common.labels.status')}</option>
            <option value="true">{t('users.active')}</option>
            <option value="false">{t('users.locked')}</option>
          </select>
          <button onClick={() => { setPage(1); fetchUsers(); }}>{t('common.actions.filter')}</button>
        </div>
      </div>

      {loading && <div className="card">{t('users.loading')}</div>}
      {error && <div className="card" style={{ color: 'red' }}>{error}</div>}

      {!loading && !error && (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: 8 }}>{t('common.table.email')}</th>
                <th style={{ padding: 8 }}>{t('common.table.name')}</th>
                <th style={{ padding: 8 }}>{t('common.table.role')}</th>
                <th style={{ padding: 8 }}>{t('common.table.department')}</th>
                <th style={{ padding: 8 }}>{t('common.table.status')}</th>
                <th style={{ padding: 8 }}>{t('common.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{user.email}</td>
                  <td style={{ padding: 8 }}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}</td>
                  <td style={{ padding: 8 }}>
                    <select value={user.role} onChange={(event) => onUpdateUser(user.id, { role: event.target.value })}>
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: 8 }}>{user.department || t('common.messages.noDepartment')}</td>
                  <td style={{ padding: 8 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={user.isActive}
                        onChange={(event) => onUpdateUser(user.id, { isActive: event.target.checked })}
                      />
                      <span>{user.isActive ? t('users.active') : t('users.locked')}</span>
                    </label>
                  </td>
                  <td style={{ padding: 8 }}>
                    <button
                      onClick={() => {
                        const department = window.prompt(t('users.editDepartmentPrompt'), user.department || '');
                        if (department !== null) {
                          onUpdateUser(user.id, { department });
                        }
                      }}
                    >
                      {t('common.actions.editDepartment')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12 }}>
            <button disabled={page <= 1} onClick={() => setPage((currentPage) => currentPage - 1)}>
              {t('users.previousPage')}
            </button>
            <span>{t('common.messages.pageIndicator', { page, total: totalPages })}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>
              {t('users.nextPage')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
