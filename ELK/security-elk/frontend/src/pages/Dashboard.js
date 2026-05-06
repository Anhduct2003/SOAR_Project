import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Dialog } from '@headlessui/react';
import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  CheckBadgeIcon,
  ClockIcon,
  CpuChipIcon,
  EyeIcon,
  ShieldExclamationIcon,
  UserMinusIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import { useLocalization } from '../contexts/LocalizationContext';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';

// ─── Utility ────────────────────────────────────────────────────────────────

const SEV_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981'
};

const STATUS_COLORS = {
  open: '#ef4444',
  investigating: '#f59e0b',
  contained: '#3b82f6',
  resolved: '#10b981',
  closed: '#6b7280'
};

function timeAgo(dateStr) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ title, value, icon: Icon, color, delta, onClick }) => {
  const isUp = delta > 0;
  const isDown = delta < 0;
  return (
    <div
      className="card cursor-pointer group"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s ease'
      }}
    >
      <div
        style={{
          backgroundColor: `${color}18`,
          color,
          padding: '0.875rem',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform 0.25s ease'
        }}
        className="group-hover:scale-110"
      >
        <Icon style={{ width: 26, height: 26 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.2rem', whiteSpace: 'nowrap' }}>
          {title}
        </p>
        <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>{value}</h3>
        {delta !== undefined && delta !== 0 && (
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: isUp ? 'var(--color-critical)' : 'var(--color-low)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            marginTop: '0.2rem'
          }}>
            {isUp ? <ArrowTrendingUpIcon style={{ width: 12 }} /> : <ArrowTrendingDownIcon style={{ width: 12 }} />}
            {isUp ? '+' : ''}{delta} so với 24h trước
          </span>
        )}
      </div>
      <div style={{
        position: 'absolute',
        top: '-30%',
        right: '-5%',
        width: '90px',
        height: '90px',
        background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`
      }} />
    </div>
  );
};

const SecurityGauge = ({ score }) => {
  const color = score > 80 ? 'var(--color-low)' : score > 50 ? 'var(--color-medium)' : 'var(--color-critical)';
  const data = [{ name: 'Score', value: score, fill: color }];
  return (
    <div style={{ position: 'relative', height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="60%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
          <RadialBar minAngle={10} background dataKey="value" cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', bottom: '18%', textAlign: 'center' }}>
        <span style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>{score}%</span>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Health Score
        </p>
      </div>
    </div>
  );
};

const CriticalBanner = ({ count, onClick }) => (
  <div
    style={{
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      border: '1px solid rgba(239, 68, 68, 0.5)',
      borderRadius: '12px',
      padding: '0.875rem 1.25rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }}
    onClick={onClick}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
      <div style={{
        backgroundColor: 'rgba(239,68,68,0.15)',
        borderRadius: '8px',
        padding: '0.5rem',
        display: 'flex'
      }}>
        <ShieldExclamationIcon style={{ width: 20, color: '#ef4444' }} />
      </div>
      <div>
        <h4 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.03em' }}>
          ⚠ PHÁT HIỆN SỰ CỐ NGHIÊM TRỌNG
        </h4>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
          {count} sự cố Critical chưa được xử lý — Hành động ngay lập tức
        </p>
      </div>
    </div>
    <button
      className="btn btn-primary"
      style={{ padding: '0.4rem 0.9rem', fontSize: '0.75rem', backgroundColor: '#ef4444', border: 'none', flexShrink: 0 }}
    >
      Xem ngay
    </button>
  </div>
);

const IntelModal = ({ isOpen, onClose, ipData, t, onBlock }) => {
  if (!ipData) return null;
  return (
    <Dialog open={isOpen} onClose={onClose} style={{ position: 'relative', zIndex: 1000 }}>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <Dialog.Panel className="card" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <Dialog.Title style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              🔍 {t('dashboard.attackerIntel') || 'Attacker Intelligence'}
            </Dialog.Title>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <XMarkIcon style={{ width: 20 }} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '1rem',
              backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source IP</p>
                <p style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-color)', fontFamily: 'monospace' }}>{ipData.ip}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Level</p>
                <span className={`badge badge-${ipData.risk}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                  {t(`common.severity.${ipData.risk}`)}
                </span>
              </div>
            </div>
            <div style={{ padding: '0.875rem', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.8125rem' }}>
              <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tóm tắt hành vi</p>
              <p style={{ margin: '0 0 0.35rem' }}>• Tổng số lần phát hiện: <strong>{ipData.count}</strong></p>
              <p style={{ margin: 0 }}>• Mức độ rủi ro: <strong style={{ color: SEV_COLORS[ipData.risk] }}>{ipData.risk?.toUpperCase()}</strong></p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#ef4444', border: 'none', fontSize: '0.875rem' }}
                onClick={() => { onBlock(ipData.ip); onClose(); }}
              >
                🚫 {t('common.actions.blockIp')}
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.875rem' }} onClick={onClose}>
                {t('common.actions.cancel')}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const LiveBuzz = () => {
  const { alerts } = useSocket();
  const { formatTime } = useLocalization();
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [alerts]);

  return (
    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.875rem', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CpuChipIcon style={{ width: 15, color: 'var(--accent-color)' }} />
          Live Event Buzz
        </h3>
        <span className="badge badge-low" style={{ fontSize: '0.6rem', animation: 'pulse 2s infinite' }}>● LIVE</span>
      </div>
      <div
        ref={scrollRef}
        style={{
          padding: '0.5rem',
          overflowY: 'auto',
          maxHeight: '280px',
          fontSize: '0.72rem',
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem'
        }}
      >
        {alerts.length === 0 ? (
          <div style={{ padding: '1.5rem 1rem', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.8rem' }}>
            ⏳ Đang chờ sự kiện từ hệ thống...
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div
              key={`${alert.id || alert.createdAt}-${index}`}
              style={{
                padding: '0.35rem 0.6rem',
                borderLeft: `2px solid ${alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f97316' : 'var(--accent-color)'}`,
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: '2px',
                animation: 'slideIn 0.3s ease'
              }}
            >
              <span style={{ color: 'var(--text-muted)', marginRight: '0.4rem' }}>
                [{formatTime(alert.createdAt || new Date().toISOString())}]
              </span>
              <span style={{
                color: alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f97316' : 'var(--text-primary)',
                fontWeight: 600
              }}>
                {alert.message || alert.title}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const RecentIncidentsTable = ({ incidents, navigate, lastSync, onRefresh, t }) => {
  const syncTime = lastSync
    ? lastSync.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldExclamationIcon style={{ width: 17, color: 'var(--accent-color)' }} />
            {t('dashboard.recentIncidents') || 'Sự cố vừa phát sinh'}
          </h3>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--color-low)',
            border: '1px solid rgba(16,185,129,0.3)'
          }}>LIVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {t('dashboard.lastSync') || 'Cập nhật lúc'} {syncTime}
          </span>
          <button
            onClick={onRefresh}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '4px 6px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Làm mới"
          >
            <ArrowPathIcon style={{ width: 14 }} />
          </button>
        </div>
      </div>

      {/* Table */}
      {incidents.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <CheckBadgeIcon style={{ width: 40, color: 'var(--color-low)', margin: '0 auto 0.75rem', display: 'block' }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
            {t('dashboard.systemClean') || 'Hệ thống sạch. Không có sự cố nào.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          {/* Table Head */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '4% 11% 34% 14% 13% 13% 11%',
            padding: '0.6rem 1.25rem',
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            gap: '0.5rem'
          }}>
            <span>#</span>
            <span>Mức độ</span>
            <span>Tiêu đề sự cố</span>
            <span>Danh mục</span>
            <span>Trạng thái</span>
            <span>Phát hiện</span>
            <span style={{ textAlign: 'right' }}>Thao tác</span>
          </div>

          {/* Rows */}
          {incidents.slice(0, 10).map((incident, idx) => {
            const isCritical = incident.severity === 'critical';
            const isHigh = incident.severity === 'high';
            const rowColor = isCritical ? '#ef4444' : isHigh ? '#f97316' : null;

            return (
              <div
                key={incident._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '4% 11% 34% 14% 13% 13% 11%',
                  padding: '0.75rem 1.25rem',
                  borderBottom: '1px solid var(--border-color)',
                  borderLeft: rowColor ? `3px solid ${rowColor}` : '3px solid transparent',
                  backgroundColor: isCritical
                    ? 'rgba(239, 68, 68, 0.04)'
                    : isHigh
                      ? 'rgba(249, 115, 22, 0.03)'
                      : 'transparent',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
                className="hover:bg-white/5"
                onClick={() => navigate(`/incidents/${incident._id}`)}
              >
                {/* # */}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</span>

                {/* Severity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: SEV_COLORS[incident.severity] || '#6b7280',
                    flexShrink: 0,
                    boxShadow: isCritical ? '0 0 6px #ef4444' : undefined
                  }} />
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: SEV_COLORS[incident.severity] || 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}>
                    {t(`common.severity.${incident.severity}`) || incident.severity}
                  </span>
                </div>

                {/* Title */}
                <span style={{
                  fontSize: '0.8125rem',
                  fontWeight: isCritical || isHigh ? 600 : 400,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {incident.title}
                </span>

                {/* Category */}
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'capitalize',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {incident.category?.replace('_', ' ') || '-'}
                </span>

                {/* Status */}
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: STATUS_COLORS[incident.status] || 'var(--text-muted)',
                  backgroundColor: `${STATUS_COLORS[incident.status]}18` || 'transparent',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'capitalize',
                  display: 'inline-block'
                }}>
                  {t(`common.incidentStatus.${incident.status}`) || incident.status}
                </span>

                {/* Time Ago */}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {timeAgo(incident.detectedAt || incident.createdAt)}
                </span>

                {/* Action */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${incident._id}`); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--accent-color)',
                      backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
                      border: '1px solid rgba(var(--accent-rgb), 0.25)',
                      borderRadius: '6px',
                      padding: '3px 10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <EyeIcon style={{ width: 12 }} />
                    Xem
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {incidents.length > 0 && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Hiển thị {Math.min(10, incidents.length)} / {incidents.length} sự cố mới nhất
          </span>
          <button
            onClick={() => navigate('/incidents')}
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--accent-color)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 0'
            }}
          >
            Xem tất cả →
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Dashboard Component ────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const { localizeApiMessage, t } = useLocalization();
  const { socket } = useSocket();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [topAttackers, setTopAttackers] = useState([]);
  const [selectedIp, setSelectedIp] = useState(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await axios.get('/api/dashboard/recent-incidents?limit=20');
      setRecent(res.data.data || []);
    } catch {
      setRecent([]);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, trendRes, attackersRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/dashboard/trend'),
        axios.get('/api/dashboard/top-attackers')
      ]);
      setStats(statsRes.data.data);
      setTrendData(trendRes.data.data);
      setTopAttackers(attackersRes.data.data);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      setError(localizeApiMessage(err?.response?.data?.message || err?.message, 'common.errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [localizeApiMessage]);

  const handleRefresh = useCallback(() => {
    fetchStats();
    fetchRecent();
  }, [fetchStats, fetchRecent]);

  useEffect(() => {
    fetchStats();
    fetchRecent();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchRecent]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => { fetchStats(); fetchRecent(); };
    socket.on('incidentCreated', refresh);
    socket.on('incidentUpdated', refresh);
    return () => {
      socket.off('incidentCreated', refresh);
      socket.off('incidentUpdated', refresh);
    };
  }, [socket, fetchStats, fetchRecent]);

  const severityKeys = useMemo(() => ['critical', 'high', 'medium', 'low'], []);

  const severityData = useMemo(() => {
    if (!stats) return [];
    return severityKeys.map((key) => ({
      key,
      name: t(`common.severity.${key}`),
      value: stats.severity[key] || 0,
      color: SEV_COLORS[key]
    }));
  }, [stats, t, severityKeys]);

  const securityScore = useMemo(() => {
    if (!stats) return 100;
    const penalty = (stats.severity.critical || 0) * 15
      + (stats.severity.high || 0) * 8
      + (stats.severity.medium || 0) * 3;
    return Math.max(0, 100 - penalty);
  }, [stats]);

  const handleBlockIp = async (ip) => {
    try {
      await axios.post('/api/incidents/block-ip', { ip, reason: 'Dashboard Quick Block' });
      toast.success(`IP ${ip} đã bị chặn thành công.`);
    } catch {
      toast.error('Không thể chặn IP này.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTop: '3px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Đang khởi tạo trung tâm kiểm soát...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="dashboard-container">

      {/* ── Critical Alert Banner ── */}
      {stats.severity.critical > 0 && (
        <CriticalBanner
          count={stats.severity.critical}
          onClick={() => navigate('/incidents?severity=critical')}
        />
      )}

      {/* ── Tầng 1: Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <StatCard
          title={t('dashboard.totalIncidents')}
          value={stats.overview.totalIncidents}
          icon={ShieldExclamationIcon}
          color="var(--accent-color)"
          onClick={() => navigate('/incidents')}
        />
        <div
          className="card cursor-pointer"
          onClick={() => setShowHealthModal(true)}
          style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, textAlign: 'center', marginBottom: '0.25rem' }}>
            {t('dashboard.securityPosture')}
          </p>
          <SecurityGauge score={securityScore} />
        </div>
        <StatCard
          title={t('dashboard.activeInvestigations')}
          value={stats.overview.investigatingIncidents}
          icon={ClockIcon}
          color="var(--color-medium)"
          onClick={() => navigate('/incidents?status=investigating')}
        />
        <StatCard
          title={t('dashboard.systemResolved')}
          value={stats.overview.resolvedIncidents}
          icon={CheckBadgeIcon}
          color="var(--color-low)"
          onClick={() => navigate('/incidents?status=resolved')}
        />
      </div>

      {/* ── Tầng 2: Charts & Analysis ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

        {/* Trend Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BoltIcon style={{ width: 17, color: 'var(--accent-color)' }} />
            {t('dashboard.threatTrend')}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '10px', fontSize: '0.8125rem' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="val" stroke="var(--accent-color)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVal)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Attackers */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserMinusIcon style={{ width: 17, color: '#ef4444' }} />
            {t('dashboard.topAttackers')}
          </h3>
          {topAttackers.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <CheckBadgeIcon style={{ width: 28, color: 'var(--color-low)', display: 'block', margin: '0 auto 0.5rem' }} />
              Không phát hiện nguồn tấn công
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {topAttackers.map((attacker, idx) => (
                <div
                  key={attacker.ip}
                  onClick={() => setSelectedIp(attacker)}
                  className="cursor-pointer"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.625rem 0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0
                    }}>{idx + 1}</span>
                    <div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'monospace', display: 'block' }}>{attacker.ip}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{attacker.count} lần phát hiện</span>
                    </div>
                  </div>
                  <span className={`badge badge-${attacker.risk}`} style={{ fontSize: '0.62rem' }}>
                    {t(`common.severity.${attacker.risk}`)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Severity Donut + Live Buzz ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

        {/* Severity Donut */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldExclamationIcon style={{ width: 17, color: 'var(--accent-color)' }} />
            {t('dashboard.severityMatrix')}
          </h3>
          <div style={{ position: 'relative', flex: 1 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  stroke="none"
                  onClick={(_, index) => navigate(`/incidents?severity=${severityKeys[index]}`)}
                  className="cursor-pointer"
                >
                  {severityData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '10px', fontSize: '0.8rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, display: 'block', color: 'var(--text-primary)', lineHeight: 1 }}>
                {stats.overview.totalIncidents}
              </span>
              <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
                {t('common.table.total')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {severityData.map((sev) => (
              <button
                key={sev.key}
                onClick={() => navigate(`/incidents?severity=${sev.key}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  fontSize: '0.75rem', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '3px 8px', borderRadius: '6px',
                  transition: 'background 0.15s', color: 'var(--text-secondary)'
                }}
                className="hover:bg-white/5"
              >
                <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: sev.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 500 }}>{sev.name}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>({sev.value})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Buzz */}
        <LiveBuzz />
      </div>

      {/* ── Tầng 3: Bảng Sự cố mới nhất (thay Map) ── */}
      <RecentIncidentsTable
        incidents={recent}
        navigate={navigate}
        lastSync={lastSync}
        onRefresh={handleRefresh}
        t={t}
      />

      {/* ── Modals ── */}
      <IntelModal
        isOpen={!!selectedIp}
        onClose={() => setSelectedIp(null)}
        ipData={selectedIp}
        t={t}
        onBlock={handleBlockIp}
      />

      <Dialog open={showHealthModal} onClose={() => setShowHealthModal(false)} style={{ position: 'relative', zIndex: 1000 }}>
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <Dialog.Panel className="card" style={{ width: '100%', maxWidth: '440px', padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <Dialog.Title style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                🛡️ {t('dashboard.securityHealthReport')}
              </Dialog.Title>
              <button onClick={() => setShowHealthModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: 20 }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  fontSize: '3.5rem', fontWeight: 800, lineHeight: 1,
                  color: securityScore > 80 ? 'var(--color-low)' : securityScore > 50 ? 'var(--color-medium)' : 'var(--color-critical)'
                }}>{securityScore}%</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.35rem' }}>Điểm sức khỏe hệ thống tổng thể</p>
              </div>
              <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Các yếu tố rủi ro đang hoạt động
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { label: t('common.severity.critical'), count: stats.severity.critical, penalty: 15, color: '#ef4444' },
                    { label: t('common.severity.high'), count: stats.severity.high, penalty: 8, color: '#f97316' },
                    { label: t('common.severity.medium'), count: stats.severity.medium, penalty: 3, color: '#f59e0b' }
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: row.color }} />
                        <span>{row.label} ({row.count} sự cố)</span>
                      </div>
                      <span style={{ color: row.color, fontWeight: 700 }}>
                        -{row.count * row.penalty} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => { setShowHealthModal(false); navigate('/incidents'); }}>
                Xem tất cả sự cố
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

    </div>
  );
};

export default Dashboard;
