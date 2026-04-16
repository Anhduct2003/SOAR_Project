import React, { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Dialog, Transition, Popover } from '@headlessui/react';
import { ChevronDownIcon, FunnelIcon, MagnifyingGlassIcon, PencilIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLocalization } from '../contexts/LocalizationContext';

const UserEditModal = ({ isOpen, onClose, user, departments, roleOptions, onSave, t }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'viewer',
    departmentId: '',
    isActive: true,
    password: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'viewer',
        departmentId: user.departmentId || '',
        isActive: user.isActive ?? true,
        password: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user.id, formData);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" style={{ position: 'relative', zIndex: 1000 }} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', transition: 'opacity 0.3s' }} aria-hidden="true" />
        </Transition.Child>

        <div style={{ position: 'fixed', inset: 0, zIndex: 1001, overflowY: 'auto' }}>
          <div style={{ display: 'flex', minHeight: '100%', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel 
                className="card"
                style={{ 
                  width: '100%', 
                  maxWidth: '500px', 
                  padding: 0, 
                  overflow: 'hidden', 
                  transform: 'translateZ(0)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Dialog.Title as="h3" style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                    {t('users.editUserTitle')}
                  </Dialog.Title>
                  <button 
                    onClick={onClose} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem', display: 'flex' }}
                  >
                    <XMarkIcon style={{ width: 24, height: 24 }} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('users.fields.firstName')}</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('users.fields.lastName')}</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('users.fields.email')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('users.fields.role')}</label>
                      <select 
                        name="role" 
                        value={formData.role} 
                        onChange={handleChange} 
                        style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                      >
                        {roleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1e293b' }}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('users.fields.department')}</label>
                      <select 
                        name="departmentId" 
                        value={formData.departmentId} 
                        onChange={handleChange} 
                        style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="" style={{ backgroundColor: '#1e293b' }}>{t('common.messages.noDepartment')}</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id} style={{ backgroundColor: '#1e293b' }}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      style={{ width: '1.125rem', height: '1.125rem', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <label htmlFor="isActive" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                      {t('users.fields.status')}: <span style={{ color: formData.isActive ? 'var(--color-low)' : 'var(--color-critical)' }}>
                        {formData.isActive ? t('users.active') : t('users.locked')}
                      </span>
                    </label>
                  </div>

                  <div style={{ marginTop: '0.5rem', padding: '1.25rem', borderRadius: '12px', backgroundColor: 'rgba(56, 189, 248, 0.03)', border: '1px dashed var(--accent-color)' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />
                      {t('users.passwordResetTitle')}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>{t('users.passwordResetSubtitle')}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('users.fields.newPassword')}</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ flex: 2, padding: '0.75rem', fontWeight: 700 }}
                    >
                      {t('common.actions.save')}
                    </button>
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="btn" 
                      style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', fontWeight: 600 }}
                    >
                      {t('common.actions.cancel')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const roleOptions = useMemo(
    () => [
      { label: t('common.roles.admin'), value: 'admin' },
      { label: t('common.roles.analyst'), value: 'analyst' },
      { label: t('common.roles.viewer'), value: 'viewer' }
    ],
    [t]
  );

  const activeFilterLabel = useMemo(() => {
    if (activeFilter === 'true') return t('users.active');
    if (activeFilter === 'false') return t('users.locked');
    return t('common.labels.status');
  }, [activeFilter, t]);

  const roleFilterLabel = useMemo(() => {
    const opt = roleOptions.find(o => o.value === roleFilter);
    return opt ? opt.label : t('common.labels.allRoles');
  }, [roleFilter, roleOptions, t]);

  const departmentFilterLabel = useMemo(() => {
    const dept = departments.find(d => d.id === departmentFilter);
    return dept ? dept.name : t('users.allDepartments');
  }, [departmentFilter, departments, t]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit };

      if (roleFilter) params.role = roleFilter;
      if (activeFilter) params.isActive = activeFilter;
      if (departmentFilter) params.departmentId = departmentFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get('/api/auth/users', { params });
      setUsers(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      setError(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.usersLoad'));
    } finally {
      setLoading(false);
    }
  }, [activeFilter, departmentFilter, limit, localizeApiMessage, page, roleFilter, searchQuery]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await axios.get('/api/departments', {
        params: { isActive: true, sortBy: 'name' }
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

  const handleEditClick = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const onSaveUser = async (id, formData) => {
    try {
      setIsSaving(true);
      // Clean password if empty
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      await axios.put(`/api/auth/users/${id}`, payload);
      toast.success(t('users.userUpdated'));
      setIsModalOpen(false);
      await fetchUsers();
    } catch (err) {
      toast.error(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ width: '100%' }} className="animate-fade-in">
      <div className="flex flex-row items-center flex-nowrap gap-4 mb-6" style={{ width: '100%' }}>
        <div 
          className="card" 
          style={{ 
            flex: 1, 
            padding: '0.5rem 0.75rem', 
            borderRadius: '12px', 
            border: '1px solid var(--border-color)', 
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <MagnifyingGlassIcon style={{ width: 18, height: 18, color: 'var(--text-muted)', marginLeft: '0.5rem' }} />
          <input
            type="text"
            placeholder={t('common.actions.search') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            style={{ 
              flex: 1, 
              padding: '0.5rem', 
              border: 'none', 
              backgroundColor: 'transparent', 
              color: 'var(--text-primary)', 
              fontSize: '0.875rem', 
              outline: 'none' 
            }}
          />

          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }} />

          <Popover style={{ position: 'relative' }}>
            <Popover.Button 
              className="btn btn-secondary"
              style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FunnelIcon style={{ width: 16, height: 16 }} />
              <span className="hidden sm:inline">{t('common.actions.filter')}</span>
              {(roleFilter || activeFilter || departmentFilter) && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-color)' }} />
              )}
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel 
                style={{ 
                  position: 'absolute', 
                  right: 0, 
                  zIndex: 50, 
                  marginTop: '0.75rem', 
                  width: '280px', 
                  backgroundColor: 'var(--bg-surface)', 
                  borderRadius: '16px', 
                  padding: '1.25rem', 
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('common.table.role')}</label>
                  <select 
                    value={roleFilter} 
                    onChange={(e) => setRoleFilter(e.target.value)} 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                  >
                    <option value="">{t('common.labels.allRoles')}</option>
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('common.labels.status')}</label>
                  <select 
                    value={activeFilter} 
                    onChange={(e) => setActiveFilter(e.target.value)} 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                  >
                    <option value="">{t('common.labels.allStatus') || t('common.labels.status')}</option>
                    <option value="true">{t('users.active')}</option>
                    <option value="false">{t('users.locked')}</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('common.table.department')}</label>
                  <select 
                    value={departmentFilter} 
                    onChange={(e) => setDepartmentFilter(e.target.value)} 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                  >
                    <option value="">{t('users.allDepartments')}</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => { fetchUsers(); }}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8125rem' }}
                  >
                    {t('common.actions.apply')}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => { setRoleFilter(''); setActiveFilter(''); setDepartmentFilter(''); setSearchQuery(''); }}
                    style={{ padding: '0.5rem', fontSize: '0.8125rem' }}
                  >
                    {t('common.actions.reset')}
                  </button>
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>
          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }} />

          <button
            className="btn btn-primary"
            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '8px', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <PlusIcon style={{ width: 16, height: 16 }} />
            <span className="hidden sm:inline">{t('common.actions.create')}</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="card p-12 text-center text-muted animate-pulse">
          {t('users.loading')}
        </div>
      )}
      
      {error && (
        <div className="card p-6 text-center text-critical border-critical/50 bg-critical/5">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="card shadow-xl overflow-hidden p-0 border-none" style={{ width: '100%' }}>
          <div className="table-container">
            <table className="standard-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>{t('common.table.name')}</th>
                  <th>{t('common.table.email')}</th>
                  <th>{t('common.table.status')}</th>
                  <th>{t('common.table.role')}</th>
                  <th>{t('common.table.department')}</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>{t('common.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-white/5 transition-colors group"
                    style={{ opacity: user.isActive ? 1 : 0.6 }}
                  >
                    <td>
                      <div 
                        style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          backgroundColor: user.isActive ? 'var(--color-low)' : 'var(--color-critical)',
                          boxShadow: user.isActive ? '0 0 10px var(--color-low)' : '0 0 10px var(--color-critical)',
                          margin: '0 auto'
                        }} 
                        title={user.isActive ? t('users.active') : t('users.locked')}
                      />
                    </td>
                    <td className="font-semibold text-primary">
                      {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8125rem' }}>{user.email}</td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: user.isActive ? 'var(--color-low)' : 'var(--color-critical)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                      }}>
                        {user.isActive ? t('users.active') : t('users.locked')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        user.role === 'admin' ? 'badge-critical' :
                        user.role === 'analyst' ? 'badge-high' :
                        'badge-low'
                      }`}>
                        {roleOptions.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8125rem' }}>
                      {user.departmentDetails?.name || t('common.messages.noDepartment')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="btn btn-secondary py-1.5 px-4 text-xs font-bold"
                        style={{ borderRadius: '8px' }}
                      >
                        {t('common.actions.edit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-color bg-white/5">
            <button
              className="btn btn-secondary py-1 text-xs"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              {t('users.previousPage')}
            </button>
            <span className="text-sm font-medium text-muted">
              {t('common.messages.pageIndicator', { page, total: totalPages })}
            </span>
            <button
              className="btn btn-secondary py-1 text-xs"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t('users.nextPage')}
            </button>
          </div>
        </div>
      )}

      <UserEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        departments={departments}
        roleOptions={roleOptions}
        onSave={onSaveUser}
        t={t}
      />
    </div>
  );
};

export default Users;
