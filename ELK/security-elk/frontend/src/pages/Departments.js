import React, { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  ChevronRightIcon, 
  EllipsisVerticalIcon, 
  PencilIcon, 
  NoSymbolIcon, 
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  parentDepartment: '',
  sortOrder: '0'
};

const DepartmentModal = ({ isOpen, onClose, editingId, form, setForm, saving, handleSubmit, parentOptions, t }) => {
  const handleChange = (field) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value
    }));
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" style={{ position: 'relative', zIndex: 100 }} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', transition: 'opacity 0.3s' }} />
        </Transition.Child>

        <div style={{ position: 'fixed', inset: 0, zIndex: 10, overflowY: 'auto' }}>
          <div style={{ display: 'flex', minHeight: '100%', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:scale-95"
            >
              <Dialog.Panel className="card" style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden', transform: 'translateZ(0)' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Dialog.Title as="h3" style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                    {editingId ? t('departments.editTitle') : t('departments.createTitle')}
                  </Dialog.Title>
                  <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <PlusIcon style={{ width: 24, height: 24, transform: 'rotate(45deg)' }} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {t('departments.fields.name')}
                    </label>
                    <input 
                      style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                      value={form.name} 
                      onChange={handleChange('name')} 
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {t('departments.fields.code')}
                    </label>
                    <input 
                      style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                      value={form.code} 
                      onChange={handleChange('code')} 
                      placeholder={t('departments.codePlaceholder')} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {t('departments.fields.description')}
                    </label>
                    <textarea
                      style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'none' }}
                      value={form.description}
                      onChange={handleChange('description')}
                      rows={3}
                      placeholder={t('departments.descriptionPlaceholder')}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {t('departments.fields.parentDepartment')}
                      </label>
                      <select 
                        style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                        value={form.parentDepartment} 
                        onChange={handleChange('parentDepartment')}
                      >
                        <option value="">{t('departments.noParent')}</option>
                        {parentOptions.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {t('departments.fields.sortOrder')}
                      </label>
                      <input 
                        type="number" 
                        min="0" 
                        style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                        value={form.sortOrder} 
                        onChange={handleChange('sortOrder')} 
                      />
                    </div>
                  </div>

                  <div style={{ paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.75rem' }}
                    >
                      {saving ? t('common.status.loading') : (editingId ? t('common.actions.save') : t('common.actions.create'))}
                    </button>
                    <button 
                      type="button" 
                      onClick={onClose}
                      className="btn"
                      style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)' }}
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

const DepartmentCard = ({ department, onEdit, onToggleActive, t }) => {
  const parentPath = department.parentDepartment ? `${department.parentDepartment.name} / ` : '';

  return (
    <div 
      className="card animate-fade-in"
      style={{ 
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        opacity: department.isActive ? 1 : 0.6,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        position: 'relative',
        transition: 'all 0.2s ease',
        height: '100%',
        minHeight: '200px',
        boxShadow: department.isActive ? '0 4px 20px -5px rgba(0,0,0,0.1)' : 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: '10px', 
          backgroundColor: 'rgba(56, 189, 248, 0.1)', 
          color: 'var(--accent-color)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <BuildingOfficeIcon style={{ width: 22, height: 22 }} />
        </div>

        <Menu as="div" style={{ position: 'relative' }}>
          <Menu.Button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-muted)' }}>
            <EllipsisVerticalIcon style={{ width: 20, height: 20 }} />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items 
              style={{ 
                position: 'absolute', 
                right: 0, 
                zIndex: 20, 
                marginTop: '0.25rem', 
                width: '160px', 
                backgroundColor: 'var(--bg-surface)', 
                borderRadius: '10px', 
                padding: '0.4rem', 
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                outline: 'none'
              }}
            >
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => onEdit(department)}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
                      fontSize: '0.8125rem', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer',
                      backgroundColor: active ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                      color: active ? 'var(--accent-color)' : 'var(--text-primary)'
                    }}
                  >
                    <PencilIcon style={{ width: 14, height: 14 }} />
                    {t('common.actions.edit')}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => onToggleActive(department)}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
                      fontSize: '0.8125rem', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer',
                      backgroundColor: active ? (department.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)') : 'transparent',
                      color: active ? (department.isActive ? 'var(--color-critical)' : 'var(--color-low)') : 'var(--text-primary)'
                    }}
                  >
                    {department.isActive ? <NoSymbolIcon style={{ width: 14, height: 14 }} /> : <CheckCircleIcon style={{ width: 14, height: 14 }} />}
                    {t(department.isActive ? 'common.actions.deactivate' : 'common.actions.activate')}
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{department.name}</h4>
          <span style={{ fontSize: '0.625rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.05)', color: 'var(--accent-color)', fontWeight: 700, fontFamily: 'monospace' }}>
            {department.code}
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {parentPath && <span style={{ opacity: 0.6 }}>{parentPath}</span>}
          <span style={{ fontWeight: 600 }}>{department.name}</span>
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.75rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {department.description || t('common.messages.notAvailable')}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <UserGroupIcon style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{department.userCount || 0} {t('users.title').toLowerCase()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <div style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            backgroundColor: department.isActive ? 'var(--color-low)' : 'var(--color-critical)',
            boxShadow: department.isActive ? '0 0 8px var(--color-low)' : 'none'
          }} />
          <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: department.isActive ? 'var(--color-low)' : 'var(--color-critical)' }}>
            {department.isActive ? t('common.status.active') : t('common.status.locked')}
          </span>
        </div>
      </div>
    </div>
  );
};

const Departments = () => {
  const { user } = useAuth();
  const { localizeApiMessage, t } = useLocalization();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/departments', {
        params: { sortBy: 'name' }
      });
      setDepartments(res.data.data || []);
    } catch (err) {
      setError(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.departmentsLoad'));
    } finally {
      setLoading(false);
    }
  }, [localizeApiMessage]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const activeCount = useMemo(
    () => departments.filter((department) => department.isActive).length,
    [departments]
  );

  const hierarchyRoots = useMemo(() => {
    if (!departments.length) return [];

    const departmentMap = new Map(
      departments.map((department) => [department.id, { ...department, children: [] }])
    );
    const roots = [];

    departmentMap.forEach((department) => {
      const parentId = department.parentDepartment?.id;
      const parent = parentId ? departmentMap.get(parentId) : null;

      if (parent && !searchTerm) {
        parent.children.push(department);
        return;
      }
      
      const matchesSearch = !searchTerm || 
        department.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        department.code.toLowerCase().includes(searchTerm.toLowerCase());

      if (matchesSearch) {
        if (!parent || searchTerm) {
          roots.push(department);
        }
      }
    });

    const sortNodes = (nodes) => {
      nodes.sort((left, right) => {
        if ((left.sortOrder ?? 0) !== (right.sortOrder ?? 0)) {
          return (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
        }
        return left.name.localeCompare(right.name);
      });
      nodes.forEach((node) => sortNodes(node.children));
    };

    if (!searchTerm) sortNodes(roots);
    return roots;
  }, [departments, searchTerm]);

  const handleOpenModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const handleEdit = (department) => {
    setEditingId(department.id);
    setForm({
      name: department.name || '',
      code: department.code || '',
      description: department.description || '',
      parentDepartment: department.parentDepartment?.id || '',
      sortOrder: String(department.sortOrder ?? 0)
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
        parentDepartment: form.parentDepartment || null,
        sortOrder: Number(form.sortOrder) || 0
      };

      if (editingId) {
        await axios.put(`/api/departments/${editingId}`, payload);
        toast.success(t('departments.updated'));
      } else {
        await axios.post('/api/departments', payload);
        toast.success(t('departments.created'));
      }

      setIsModalOpen(false);
      await fetchDepartments();
    } catch (err) {
      const errorData = err?.response?.data;
      const errorMessage = errorData?.errors ? errorData.errors.join(', ') : (errorData?.message || err?.message);
      toast.error(localizeApiMessage(errorMessage, 'common.errors.departmentSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (department) => {
    try {
      await axios.put(`/api/departments/${department.id}`, {
        isActive: !department.isActive
      });
      toast.success(t(department.isActive ? 'departments.deactivated' : 'departments.activated'));
      await fetchDepartments();
    } catch (err) {
      toast.error(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.updateFailed'));
    }
  };

  const toggleExpand = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const parentOptions = useMemo(
    () => departments.filter((department) => department.isActive && department.id !== editingId),
    [departments, editingId]
  );

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1rem', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
          <NoSymbolIcon style={{ width: 64, height: 64, color: 'var(--color-critical)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{t('departments.title')}</h2>
          <p style={{ color: 'var(--color-critical)', fontWeight: 600 }}>{t('departments.adminOnly')}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
            {t('departments.title')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
            {t('departments.summary', { active: activeCount, total: departments.length })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={fetchDepartments}
            className="btn"
            style={{ padding: '0.625rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '10px' }}
            title={t('common.actions.refresh')}
          >
            <ArrowPathIcon style={{ width: 20, height: 20 }} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleOpenModal}
            className="btn btn-primary"
            style={{ fontWeight: 700, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusIcon style={{ width: 20, height: 20 }} />
            {t('common.actions.create')}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="card" style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ position: 'relative', maxWidth: '300px' }}>
          <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder={t('common.actions.search') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '8px', 
              border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', 
              color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem' 
            }}
          />
        </div>
      </div>

      <div style={{ minHeight: '400px' }}>
        {loading && departments.length === 0 ? (
          <div style={{ padding: '5rem 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <ArrowPathIcon style={{ width: 48, height: 48, color: 'var(--accent-color)' }} className="animate-spin" />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('departments.loading')}</p>
          </div>
        ) : error ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-critical)', fontWeight: 700 }}>
            {error}
          </div>
        ) : hierarchyRoots.length === 0 ? (
          <div className="card" style={{ padding: '4rem 0', textAlign: 'center', borderStyle: 'dashed' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{searchTerm ? t('common.messages.noResults') : t('departments.empty')}</p>
          </div>
        ) : (
          <div 
            className="animate-fade-in"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '1.5rem' 
            }}
          >
            {hierarchyRoots.map((department) => (
              <DepartmentCard 
                key={department.id} 
                department={department} 
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      <DepartmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingId={editingId}
        form={form}
        setForm={setForm}
        saving={saving}
        handleSubmit={handleSubmit}
        parentOptions={parentOptions}
        t={t}
      />

      <style>{`
        .sm-block { display: none; }
        @media (min-width: 640px) { .sm-block { display: block; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Departments;
