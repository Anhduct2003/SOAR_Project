import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLocalization } from '../contexts/LocalizationContext';

const Users = () => {
  const { localizeApiMessage, t } = useLocalization();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

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
      if (departmentFilter) {
        params.departmentId = departmentFilter;
      }

      const res = await axios.get('/api/auth/users', { params });
      setUsers(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      setError(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.usersLoad'));
    } finally {
      setLoading(false);
    }
  }, [activeFilter, departmentFilter, limit, localizeApiMessage, page, roleFilter]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await axios.get('/api/departments', {
        params: {
          isActive: true,
          sortBy: 'name'
        }
      });
      setDepartments(res.data.data || []);
    } catch (err) {
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const onUpdateUser = async (id, updates, successKey = 'users.userUpdated') => {
    try {
      setUpdatingUserId(id);
      await axios.put(`/api/auth/users/${id}`, updates);
      toast.success(t(successKey));
      await fetchUsers();
    } catch (err) {
      toast.error(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.updateFailed'));
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div>
      <h2>{t('users.title')}</h2>

      <div className="card" style={{ marginBottom: 12, padding: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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

          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option value="">{t('users.allDepartments')}</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setPage(1);
              if (page === 1) {
                fetchUsers();
              }
            }}
          >
            {t('common.actions.filter')}
          </button>
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
              {users.map((user) => {
                const isUpdating = updatingUserId === user.id;

                return (
                  <tr key={user.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>{user.email}</td>
                    <td style={{ padding: 8 }}>
                      {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}
                    </td>
                    <td style={{ padding: 8 }}>
                      <select
                        value={user.role}
                        disabled={isUpdating}
                        onChange={(event) =>
                          onUpdateUser(user.id, { role: event.target.value }, 'users.roleUpdated')
                        }
                      >
                        {roleOptions.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: 8 }}>
                      <select
                        value={user.departmentId || ''}
                        disabled={isUpdating}
                        onChange={(event) =>
                          onUpdateUser(
                            user.id,
                            { departmentId: event.target.value || null },
                            'users.departmentUpdated'
                          )
                        }
                      >
                        <option value="">{t('common.messages.noDepartment')}</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: 8 }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={user.isActive}
                          disabled={isUpdating}
                          onChange={(event) =>
                            onUpdateUser(
                              user.id,
                              { isActive: event.target.checked },
                              event.target.checked ? 'users.userActivated' : 'users.userLocked'
                            )
                          }
                        />
                        <span>{user.isActive ? t('users.active') : t('users.locked')}</span>
                      </label>
                    </td>
                    <td style={{ padding: 8 }}>
                      {isUpdating ? (
                        t('common.status.loading')
                      ) : user.departmentId ? (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateUser(user.id, { departmentId: null }, 'users.departmentUpdated')
                          }
                        >
                          {t('common.actions.clear')}
                        </button>
                      ) : (
                        t('common.messages.noDepartment')
                      )}
                    </td>
                  </tr>
                );
              })}
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
