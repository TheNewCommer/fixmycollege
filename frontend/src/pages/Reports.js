import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import ReportCard from '../components/ReportCard';
import toast from 'react-hot-toast';
import { FiPlus, FiFilter, FiRefreshCw } from 'react-icons/fi';

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

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasNew, setHasNew] = useState(false);
const [filters, setFilters] = useState({ category: '', status: 'active_only', urgency: '' });  const [total, setTotal] = useState(0);
  const { on, off } = useSocket();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setHasNew(false);
    try {
const apiFilters = { ...filters, limit: 30 };
if (filters.status === 'active_only') {
  delete apiFilters.status;
  apiFilters.excludeResolved = true;
}
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
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ─── REAL-TIME NEW REPORT ───────────────────────────────
  useEffect(() => {
    const handleNew = () => setHasNew(true);
    const handleStatus = ({ reportId, status }) => {
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status } : r));
    };
    const handleUpvote = ({ reportId, upvoteCount }) => {
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, upvoteCount } : r));
    };
    on('new_report', handleNew);
    on('status_update', handleStatus);
    on('upvote_update', handleUpvote);
    return () => { off('new_report', handleNew); off('status_update', handleStatus); off('upvote_update', handleUpvote); };
  }, [on, off]);

  const handleUpvoteUpdate = (reportId, upvoteCount) => {
    setReports(prev => prev.map(r => r._id === reportId ? { ...r, upvoteCount } : r));
  };

const handleFilterChange = (key, val) => {
  if (key === 'status' && val === '') {
    setFilters(f => ({ ...f, status: 'active_only' }));
  } else {
    setFilters(f => ({ ...f, [key]: val }));
  }
};
  // Stats
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, resolved: 0, critical: 0 });

  return (
    <div className="page">
      {/* ─── HEADER ─── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Civic Issues</h1>
          <p style={styles.subtitle}>{total} total reports on campus</p>
        </div>
        <Link to="/submit" className="btn btn-primary">
          <FiPlus /> Report Issue
        </Link>
      </div>

      {/* ─── MINI STATS ─── */}
      <div style={styles.statsRow}>
        {[
          { label: 'Pending', val: stats.pending, color: '#9ca3af' },
          { label: 'In Progress', val: stats.inProgress, color: '#f59e0b' },
          { label: 'Resolved', val: stats.resolved, color: '#22c55e' },
          { label: 'Critical', val: stats.critical, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={styles.statPill}>
            <span style={{ ...styles.statDot, background: s.color }} />
            <span style={styles.statVal}>{s.val}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>
      {/* ─── TABS ─── */}
<div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
  <button
    onClick={() => handleFilterChange('status', '')}
    style={{
      padding: '8px 20px', borderRadius: 8, border: '1.5px solid',
      fontWeight: 600, fontSize: 14, cursor: 'pointer',
      fontFamily: 'DM Sans, sans-serif',
      background: filters.status !== 'resolved' ? '#0f4c35' : 'white',
      color: filters.status !== 'resolved' ? 'white' : '#6b8a78',
      borderColor: filters.status !== 'resolved' ? '#0f4c35' : '#e2e8e4',
    }}
  >
    🔴 Active Issues
  </button>
  <button
    onClick={() => handleFilterChange('status', 'resolved')}
    style={{
      padding: '8px 20px', borderRadius: 8, border: '1.5px solid',
      fontWeight: 600, fontSize: 14, cursor: 'pointer',
      fontFamily: 'DM Sans, sans-serif',
      background: filters.status === 'resolved' ? '#16a34a' : 'white',
      color: filters.status === 'resolved' ? 'white' : '#6b8a78',
      borderColor: filters.status === 'resolved' ? '#16a34a' : '#e2e8e4',
    }}
  >
    ✅ Resolved Issues ({stats.resolved})
  </button>
</div>

      {/* ─── NEW REPORT BANNER ─── */}
      {hasNew && (
        <div style={styles.newBanner} onClick={fetchReports}>
          <FiRefreshCw size={14} /> New report submitted — click to refresh
        </div>
      )}

      {/* ─── FILTERS ─── */}
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

      {/* ─── REPORTS GRID ─── */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /><p>Loading reports...</p></div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <h3>No reports found</h3>
          <p>No issues match your current filters. Be the first to report one!</p>
          <Link to="/submit" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}><FiPlus /> Report an Issue</Link>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: 16 }}>
          {reports.map(r => <ReportCard key={r._id} report={r} onUpvote={handleUpvoteUpdate} />)}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#0d1f18', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9ab5a5' },
  statsRow: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  statPill: { display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #e2e8e4', borderRadius: 100, padding: '6px 14px' },
  statDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  statVal: { fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#0d1f18' },
  statLabel: { fontSize: 12, color: '#9ab5a5' },
  newBanner: { display: 'flex', alignItems: 'center', gap: 8, background: '#0f4c35', color: 'white', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16 },
  filters: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  filterSelect: { width: 'auto', flex: '1 1 150px', maxWidth: 200, padding: '8px 32px 8px 12px', fontSize: 13 },
};
