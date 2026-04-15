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
  ArrowPathIcon
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

const DepartmentRow = ({ department, depth = 0, expandedRows, toggleExpand, onEdit, onToggleActive, t }) => {
  const isExpanded = expandedRows.has(department.id);
  const hasChildren = department.children && department.children.length > 0;

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div 
        className="card"
        style={{ 
          marginLeft: depth * 24,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          opacity: department.isActive ? 1 : 0.7,
          backgroundColor: department.isActive ? 'var(--bg-surface)' : 'rgba(148, 163, 184, 0.05)',
          borderColor: department.isActive ? 'var(--border-color)' : 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          {hasChildren ? (
            <button 
              onClick={() => toggleExpand(department.id)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                transition: 'transform 0.2s',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                color: isExpanded ? 'var(--accent-color)' : 'var(--text-muted)'
              }}
            >
              <ChevronRightIcon style={{ width: 18, height: 18 }} />
            </button>
          ) : (
            <div style={{ width: 26 }} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {department.name}
              </span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-color)', fontSize: '0.7rem', fontWeight: 600, fontFamily: 'monospace' }}>
                {department.code}
              </span>
              {!department.isActive && (
                <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                  {t('common.status.locked')}
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {department.description || t('common.messages.notAvailable')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'none', fontSize: '0.75rem', color: 'var(--text-muted)' }} className="sm-block">
            {t('departments.fields.sortOrder')}: {department.sortOrder}
          </div>

          <Menu as="div" style={{ position: 'relative' }}>
            <Menu.Button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--text-muted)', display: 'flex' }}>
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
                  marginTop: '0.5rem', 
                  width: '180px', 
                  backgroundColor: 'var(--bg-surface)', 
                  borderRadius: '12px', 
                  padding: '0.5rem', 
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
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: active ? 'rgba(2, 132, 199, 0.1)' : 'transparent',
                        color: active ? 'var(--accent-color)' : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <PencilIcon style={{ width: 16, height: 16 }} />
                      {t('common.actions.edit')}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onToggleActive(department)}
                      style={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: active ? (department.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)') : 'transparent',
                        color: active ? (department.isActive ? 'var(--color-critical)' : 'var(--color-low)') : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {department.isActive ? <NoSymbolIcon style={{ width: 16, height: 16 }} /> : <CheckCircleIcon style={{ width: 16, height: 16 }} />}
                      {t(department.isActive ? 'common.actions.deactivate' : 'common.actions.activate')}
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {department.children.map((child) => (
              <DepartmentRow 
                key={child.id} 
                department={child} 
                depth={depth + 1} 
                expandedRows={expandedRows}
                toggleExpand={toggleExpand}
                onEdit={onEdit}
                onToggleActive={onToggleActive}
                t={t}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            style={{ padding: '0.625rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            title={t('common.actions.refresh')}
          >
            <ArrowPathIcon style={{ width: 20, height: 20 }} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleOpenModal}
            className="btn btn-primary"
            style={{ fontWeight: 700 }}
          >
            <PlusIcon style={{ width: 20, height: 20 }} />
            {t('common.actions.create')}
          </button>
        </div>
      </header>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <MagnifyingGlassIcon style={{ position: 'absolute', left: '1rem', width: 20, height: 20, color: 'var(--text-muted)' }} />
        <input 
          type="text"
          placeholder={t('common.actions.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '0.875rem 1rem 0.875rem 3rem', 
            borderRadius: '16px', 
            border: '1px solid var(--border-color)', 
            backgroundColor: 'var(--bg-surface)', 
            color: 'var(--text-primary)', 
            outline: 'none',
            fontSize: '1rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
          <div className="animate-fade-in">
            {hierarchyRoots.map((department) => (
              <DepartmentRow 
                key={department.id} 
                department={department} 
                expandedRows={expandedRows}
                toggleExpand={toggleExpand}
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
