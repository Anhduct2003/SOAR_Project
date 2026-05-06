import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  ArrowDownTrayIcon,
  BellSlashIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  XMarkIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';

const Incidents = () => {
  const { token } = useAuth();
  const { formatDateTime, localizeApiMessage, t } = useLocalization();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [detailIncident, setDetailIncident] = useState(null);

  const fetchIncidents = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 15,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
        page: filters.page
      };

      if (filters.severity) {
        params.severity = filters.severity;
      }
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.sinceHours) {
        params.since = new Date(Date.now() - filters.sinceHours * 3600 * 1000).toISOString();
      }
      if (filters.q) {
        params.q = filters.q;
      }

      const res = await axios.get('/api/incidents', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.data) {
        setIncidents(res.data.data.map((incident) => ({ id: incident._id || incident.id, ...incident })));
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      setError(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.incidentsLoad'));
    } finally {
      setLoading(false);
    }
  }, [filters, localizeApiMessage, token]);

  useEffect(() => {
    const timer = setTimeout(fetchIncidents, 300);
    return () => clearTimeout(timer);
  }, [fetchIncidents]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  };

  const handleBlockIP = async (ip) => {
    if (!ip) {
      window.alert(t('common.errors.blockIpFailed'));
      return;
    }

    const reason = window.prompt(t('incidents.blockPrompt', { ip }), 'Manual block from incident list');
    if (!reason) {
      return;
    }

    try {
      await axios.post(
        '/api/incidents/block-ip',
        { ip, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.alert(t('incidents.blockSuccess', { ip }));
    } catch (err) {
      window.alert(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.blockIpFailed'));
    }

    setActiveMenu(null);
  };

  const handleViewDetails = (incident) => {
    setDetailIncident(incident);
    setActiveMenu(null);
  };

  const handleUpdateStatus = async (incident, status) => {
    try {
      const res = await axios.put(
        `/api/incidents/${incident.id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedIncident = { id: res.data.data._id || res.data.data.id, ...res.data.data };
      setIncidents((prev) => prev.map((item) => (item.id === incident.id ? updatedIncident : item)));
      setDetailIncident((prev) => (prev?.id === incident.id ? updatedIncident : prev));
      setActiveMenu(null);
    } catch (err) {
      window.alert(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.updateFailed'));
    }
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Severity', 'Status', 'Category', 'Detected At', 'IPs'];
    const rows = incidents.map((incident) =>
      [
        incident.title,
        incident.severity,
        incident.status,
        incident.category,
        formatDateTime(incident.detectedAt || incident.createdAt),
        (incident.ipAddresses || []).join(' ')
      ]
        .map((value) => `"${value}"`)
        .join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incidents_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="incidents-page">
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('incidents.searchPlaceholder')}
              value={filters.q}
              onChange={(event) => handleFilterChange('q', event.target.value)}
              style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FunnelIcon style={{ width: 18, color: 'var(--text-secondary)' }} />
              <select
                value={filters.severity}
                onChange={(event) => handleFilterChange('severity', event.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              >
                <option value="">{t('common.labels.allSeverity')}</option>
                <option value="low">{t('common.severity.low')}</option>
                <option value="medium">{t('common.severity.medium')}</option>
                <option value="high">{t('common.severity.high')}</option>
                <option value="critical">{t('common.severity.critical')}</option>
              </select>
            </div>

            <select
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              <option value="">{t('common.labels.allStatus')}</option>
              <option value="open">{t('common.incidentStatus.open')}</option>
              <option value="investigating">{t('common.incidentStatus.investigating')}</option>
              <option value="contained">{t('common.incidentStatus.contained')}</option>
              <option value="resolved">{t('common.incidentStatus.resolved')}</option>
            </select>

            <button className="btn btn-primary" onClick={handleExportCSV}>
              <ArrowDownTrayIcon style={{ width: 18 }} />
              {t('common.actions.export')}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem 1.5rem', width: '40px' }}>
                <input
                  type="checkbox"
                  checked={incidents.length > 0 && incidents.every((incident) => selected[incident.id])}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    const nextSelected = {};
                    incidents.forEach((incident) => {
                      nextSelected[incident.id] = checked;
                    });
                    setSelected(nextSelected);
                  }}
                />
              </th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('common.table.title').toUpperCase()}</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('common.table.severity').toUpperCase()}</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('common.table.status').toUpperCase()}</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t('common.table.detectedAt').toUpperCase()}</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'right' }}>{t('common.table.response').toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('incidents.loading')}
                </td>
              </tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('incidents.empty')}
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <input
                      type="checkbox"
                      checked={!!selected[incident.id]}
                      onChange={(event) => setSelected((prev) => ({ ...prev, [incident.id]: event.target.checked }))}
                    />
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{incident.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {incident.category} | {(incident.ipAddresses || []).join(', ')}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className={`badge badge-${incident.severity}`}>{t(`common.severity.${incident.severity}`)}</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: incident.status === 'resolved' ? 'var(--color-low)' : 'var(--color-medium)' }} />
                      {t(`common.incidentStatus.${incident.status}`)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {formatDateTime(incident.detectedAt || incident.createdAt)}
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
                      <div
                        style={{
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
                        }}
                      >
                        <button
                          onClick={() => handleViewDetails(incident)}
                          className="menu-item"
                          style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                        >
                          <EyeIcon style={{ width: 16 }} /> {t('common.actions.viewDetails')}
                        </button>
                        <button
                          onClick={() => handleBlockIP(incident.ipAddresses?.[0])}
                          className="menu-item"
                          style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-critical)' }}
                        >
                          <NoSymbolIcon style={{ width: 16 }} /> {t('common.actions.blockIp')}
                        </button>
                        <button className="menu-item" style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                          <BellSlashIcon style={{ width: 16 }} /> {t('common.actions.muteAlert')}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(incident, 'resolved')}
                          className="menu-item"
                          style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-low)' }}
                        >
                          <CheckCircleIcon style={{ width: 16 }} /> Mark resolved
                        </button>
                        <button className="menu-item" style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer', borderTop: '1px solid var(--border-color)', color: 'var(--accent-color)' }}>
                          <UserCircleIcon style={{ width: 16 }} /> {t('common.actions.assignToMe')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.01)' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {t('incidents.showingIncidents', { count: incidents.length })}
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
              {t('common.messages.pageIndicator', { page: filters.page, total: totalPages })}
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

      {detailIncident && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Incident details"
          onClick={() => setDetailIncident(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(760px, 100%)',
              maxHeight: '85vh',
              overflow: 'auto',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)'
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.02)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.45rem' }}>
                  Incident details
                </div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {detailIncident.title}
                </h2>
              </div>
              <button
                onClick={() => setDetailIncident(null)}
                className="btn"
                aria-label="Close incident details"
                style={{ padding: '0.45rem', color: 'var(--text-secondary)' }}
              >
                <XMarkIcon style={{ width: 20 }} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                {detailIncident.status !== 'resolved' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleUpdateStatus(detailIncident, 'resolved')}
                    style={{ backgroundColor: 'var(--color-low)', border: 'none' }}
                  >
                    <CheckCircleIcon style={{ width: 18 }} />
                    Mark resolved
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>Severity</div>
                  <span className={`badge badge-${detailIncident.severity}`}>{t(`common.severity.${detailIncident.severity}`)}</span>
                </div>
                <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>Status</div>
                  <div style={{ fontWeight: 600 }}>{t(`common.incidentStatus.${detailIncident.status}`)}</div>
                </div>
                <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>Category</div>
                  <div style={{ fontWeight: 600 }}>{detailIncident.category || t('common.messages.notAvailable')}</div>
                </div>
                <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>Source</div>
                  <div style={{ fontWeight: 600 }}>{detailIncident.source || t('common.messages.notAvailable')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>Detected at</div>
                  <div style={{ color: 'var(--text-primary)' }}>{formatDateTime(detailIncident.detectedAt || detailIncident.createdAt)}</div>
                </div>
                <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>Created at</div>
                  <div style={{ color: 'var(--text-primary)' }}>{formatDateTime(detailIncident.createdAt || detailIncident.detectedAt)}</div>
                </div>
              </div>

              <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.55rem', fontWeight: 600 }}>IP addresses</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(detailIncident.ipAddresses?.length ? detailIncident.ipAddresses : [t('common.messages.notAvailable')]).map((ip) => (
                    <span
                      key={ip}
                      style={{
                        padding: '0.35rem 0.6rem',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                        color: 'var(--accent-color)',
                        fontSize: '0.8125rem',
                        fontWeight: 600
                      }}
                    >
                      {ip}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ padding: '0.9rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.55rem', fontWeight: 600 }}>Description</div>
                <div style={{ lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {detailIncident.description || t('common.messages.notAvailable')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents;
