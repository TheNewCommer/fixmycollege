import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, announcementsAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import ReportCard from '../components/ReportCard';
import toast from 'react-hot-toast';
import { FiPlus, FiFilter, FiRefreshCw, FiBell, FiAlertCircle, FiCheckCircle, FiClock, FiZap } from 'react-icons/fi';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'cleanliness', label: '🗑️ Cleanliness' },
  { value: 'hostel_infrastructure', label: '🏠 Hostel' },
  { value: 'water', label: '💧 Water' },
  { value: 'electricity', label: '⚡ Electricity' },
  { value: 'mess', label: '🍽️ Mess' },
  { value: 'campus_infrastructure', label: '🏛️ Campus' },
  { value: 'internet_tech', label: '📶 Tech/WiFi' },
  { value: 'security', label: '🔒 Security' },
  { value: 'other_civic', label: '📌 Other' },
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: '⬜ Pending' },
  { value: 'assigned', label: '🔵 Assigned' },
  { value: 'in_progress', label: '🟡 In Progress' },
  { value: 'resolved', label: '✅ Resolved' },
];

const URGENCIES = [
  { value: '', label: 'All Urgencies' },
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
];

const TYPE_COLORS = {
  info:    { bg: '#eff6ff', border: '#3b82f6', color: '#1d4ed8', icon: 'ℹ️' },
  warning: { bg: '#fffbeb', border: '#f59e0b', color: '#d97706', icon: '⚠️' },
  success: { bg: '#f0fdf4', border: '#22c55e', color: '#16a34a', icon: '✅' },
  urgent:  { bg: '#fef2f2', border: '#ef4444', color: '#dc2626', icon: '🚨' },
};

export default function Reports() {
  const { isAdmin, user } = useAuth();
  const isStudent = !isAdmin;
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' | 'announcements'
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasNew, setHasNew] = useState(false);
  const [filters, setFilters] = useState({ category: '', status: 'active_only', urgency: '' });
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, resolved: 0, critical: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const { on, off } = useSocket();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setHasNew(false);
    try {
      const apiFilters = { ...filters, limit: 30 };
      if (filters.status === 'active_only') { delete apiFilters.status; apiFilters.excludeResolved = true; }
      const { data } = await reportsAPI.getAll(apiFilters);
      setReports(data.reports);
      setTotal(data.total);
      const { data: allData } = await reportsAPI.getAll({ limit: 500 });
      setStats({
        pending: allData.reports.filter(r => r.status === 'pending').length,
        inProgress: allData.reports.filter(r => r.status === 'in_progress').length,
        resolved: allData.reports.filter(r => r.status === 'resolved').length,
        critical: allData.reports.filter(r => r.urgency === 'critical').length,
      });
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  }, [filters]);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    try {
      const { data } = await announcementsAPI.getAll();
      setAnnouncements(data.announcements);
      // Count unread (not dismissed)
      const dismissed = JSON.parse(localStorage.getItem('fmc_dismissed_announcements') || '[]');
      setUnreadAnnouncements(data.announcements.filter(a => !dismissed.includes(a._id)).length);
    } catch {}
    finally { setAnnouncementsLoading(false); }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  useEffect(() => {
    const handleNew = () => setHasNew(true);
    const handleStatus = ({ reportId, status }) => setReports(prev => prev.map(r => r._id === reportId ? { ...r, status } : r));
    const handleUpvote = ({ reportId, upvoteCount }) => setReports(prev => prev.map(r => r._id === reportId ? { ...r, upvoteCount } : r));
    const handleAnnouncement = (a) => { setAnnouncements(prev => [a, ...prev]); setUnreadAnnouncements(n => n + 1); };
    on('new_report', handleNew);
    on('status_update', handleStatus);
    on('upvote_update', handleUpvote);
    on('new_announcement', handleAnnouncement);
    return () => { off('new_report', handleNew); off('status_update', handleStatus); off('upvote_update', handleUpvote); off('new_announcement', handleAnnouncement); };
  }, [on, off]);

  const handleUpvoteUpdate = (reportId, upvoteCount) => setReports(prev => prev.map(r => r._id === reportId ? { ...r, upvoteCount } : r));

  const handleFilterChange = (key, val) => {
    if (key === 'status' && val === '') setFilters(f => ({ ...f, status: 'active_only' }));
    else setFilters(f => ({ ...f, [key]: val }));
  };

  const handleDismissAnnouncement = (id) => {
    const dismissed = JSON.parse(localStorage.getItem('fmc_dismissed_announcements') || '[]');
    localStorage.setItem('fmc_dismissed_announcements', JSON.stringify([...dismissed, id]));
    setUnreadAnnouncements(n => Math.max(0, n - 1));
  };

  const handleAdminDeleteAnnouncement = async (id) => {
    try {
      await announcementsAPI.delete(id);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      toast.success('Announcement removed');
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="page">

      {/* ─── PAGE HEADER ─── */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Campus Board</h1>
          <p style={styles.subtitle}>View civic issues, updates and announcements from Sershah Engineering College</p>
        </div>
      </div>

      {/* ─── STATS ROW ─── */}
      <div style={styles.statsRow}>
        {[
          { label: 'Pending', val: stats.pending, color: '#9ca3af', icon: <FiClock size={14} /> },
          { label: 'In Progress', val: stats.inProgress, color: '#f59e0b', icon: <FiRefreshCw size={14} /> },
          { label: 'Resolved', val: stats.resolved, color: '#22c55e', icon: <FiCheckCircle size={14} /> },
          { label: 'Critical', val: stats.critical, color: '#ef4444', icon: <FiZap size={14} /> },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <span style={{ color: s.color }}>{s.icon}</span>
            <span style={{ ...styles.statVal, color: s.color }}>{s.val}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ─── TABS ─── */}
      <div style={styles.tabsRow}>
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('issues')}
            style={{ ...styles.tab, ...(activeTab === 'issues' ? styles.tabActive : {}) }}
          >
            <FiAlertCircle size={15} /> Civic Issues
            <span style={{ ...styles.tabBadge, background: activeTab === 'issues' ? 'rgba(255,255,255,0.25)' : '#f0fdf4', color: activeTab === 'issues' ? 'white' : '#0f4c35' }}>{total}</span>
          </button>
          <button
            onClick={() => { setActiveTab('announcements'); setUnreadAnnouncements(0); }}
            style={{ ...styles.tab, ...(activeTab === 'announcements' ? styles.tabActiveAnnounce : {}) }}
          >
            <FiBell size={15} /> Announcements
            {unreadAnnouncements > 0 && (
              <span style={{ ...styles.tabBadge, background: '#dc2626', color: 'white' }}>{unreadAnnouncements}</span>
            )}
          </button>
        </div>

        {/* Active/Resolved toggle — only on issues tab */}
        {activeTab === 'issues' && (
          <div style={styles.toggleGroup}>
            <button onClick={() => handleFilterChange('status', '')} style={{ ...styles.toggleBtn, ...(filters.status !== 'resolved' ? styles.toggleActive : {}) }}>
              🔴 Active
            </button>
            <button onClick={() => handleFilterChange('status', 'resolved')} style={{ ...styles.toggleBtn, ...(filters.status === 'resolved' ? styles.toggleActiveGreen : {}) }}>
              ✅ Resolved ({stats.resolved})
            </button>
          </div>
        )}
      </div>

      {/* ─── ISSUES TAB ─── */}
      {activeTab === 'issues' && (
        <>
          {hasNew && (
            <div style={styles.newBanner} onClick={fetchReports}>
              <FiRefreshCw size={14} /> New report submitted — click to refresh
            </div>
          )}
          <div style={styles.filters}>
            <FiFilter size={14} style={{ color: '#9ab5a5', flexShrink: 0 }} />
            <select className="form-input" style={styles.filterSelect} value={filters.category} onChange={e => handleFilterChange('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select className="form-input" style={styles.filterSelect} value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select className="form-input" style={styles.filterSelect} value={filters.urgency} onChange={e => handleFilterChange('urgency', e.target.value)}>
              {URGENCIES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={fetchReports}><FiRefreshCw size={14} /></button>
          </div>

          {loading ? (
            <div className="loading-page"><div className="spinner" /><p>Loading reports...</p></div>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <h3>No reports found</h3>
              <p>No issues match your current filters.</p>
            </div>
          ) : (
            <div className="grid-2" style={{ gap: 16 }}>
              {reports.map(r => (
                <ReportCard key={r._id} report={r} onUpvote={handleUpvoteUpdate} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── ANNOUNCEMENTS TAB ─── */}
      {activeTab === 'announcements' && (
        <div>
          {announcementsLoading ? (
            <div className="loading-page"><div className="spinner" /></div>
          ) : announcements.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 12 }}>📢</div>
              <h3>No announcements yet</h3>
              <p>Admin will post important campus announcements here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {announcements.map(a => {
                const t = TYPE_COLORS[a.type] || TYPE_COLORS.info;
                const dismissed = JSON.parse(localStorage.getItem('fmc_dismissed_announcements') || '[]');
                return (
                  <div key={a._id} style={{ ...styles.announcementCard, background: t.bg, borderColor: t.border, borderLeft: `4px solid ${t.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{t.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ ...styles.announceBadge, background: t.border, color: 'white' }}>{a.type.toUpperCase()}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#0d1f18' }}>{a.title}</span>
                        </div>
                        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>{a.content}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                          <span style={{ fontSize: 12, color: '#9ab5a5' }}>📌 Posted by {a.postedByName}</span>
                          <span style={{ fontSize: 12, color: '#9ab5a5' }}>🕐 {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => isAdmin ? handleAdminDeleteAnnouncement(a._id) : handleDismissAnnouncement(a._id)}
                        style={styles.dismissBtn}
                        title={isAdmin ? 'Delete' : 'Dismiss'}
                      >✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#0d1f18', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9ab5a5', lineHeight: 1.5 },
  statsRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  statCard: { flex: '1 1 100px', display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e8f0ec', borderRadius: 12, padding: '12px 18px', boxShadow: '0 1px 4px rgba(15,76,53,0.05)' },
  statVal: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20 },
  statLabel: { fontSize: 12, color: '#9ab5a5', fontWeight: 500 },
  tabsRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  tabs: { display: 'flex', gap: 6, background: '#f0f4f2', padding: 4, borderRadius: 12 },
  tab: { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 9, border: 'none', background: 'none', fontSize: 14, fontWeight: 600, color: '#6b8a78', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' },
  tabActive: { background: '#0f4c35', color: 'white', boxShadow: '0 2px 8px rgba(15,76,53,0.2)' },
  tabActiveAnnounce: { background: '#f59e0b', color: 'white', boxShadow: '0 2px 8px rgba(245,158,11,0.25)' },
  tabBadge: { fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 100 },
  toggleGroup: { display: 'flex', gap: 6 },
  toggleBtn: { padding: '7px 16px', borderRadius: 8, border: '1.5px solid #e2e8e4', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#6b8a78', fontFamily: 'DM Sans, sans-serif' },
  toggleActive: { background: '#0f4c35', color: 'white', borderColor: '#0f4c35' },
  toggleActiveGreen: { background: '#16a34a', color: 'white', borderColor: '#16a34a' },
  newBanner: { display: 'flex', alignItems: 'center', gap: 8, background: '#0f4c35', color: 'white', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16 },
  filters: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  filterSelect: { width: 'auto', flex: '1 1 150px', maxWidth: 200, padding: '8px 32px 8px 12px', fontSize: 13 },
  announcementCard: { border: '1.5px solid', borderRadius: 14, padding: '18px 20px', transition: 'box-shadow 0.15s' },
  announceBadge: { fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100, letterSpacing: 0.5 },
  dismissBtn: { background: 'none', border: 'none', color: '#9ab5a5', cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0, borderRadius: 6 },
};
