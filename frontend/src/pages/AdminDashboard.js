import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiClock, FiAlertTriangle, FiLoader, FiUploadCloud, FiRefreshCw, FiX } from 'react-icons/fi';

const STATUS_OPTIONS = [
  { value: 'assigned', label: '🔵 Mark Assigned', color: '#1d4ed8' },
  { value: 'in_progress', label: '🟡 Mark In Progress', color: '#d97706' },
  { value: 'resolved', label: '✅ Mark Resolved', color: '#16a34a' },
  { value: 'rejected', label: '❌ Reject Report', color: '#dc2626' },
];

const URGENCY_COLORS = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#16a34a' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const { on, off } = useSocket();
  const fileRef = useRef();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [filters, setFilters] = useState({ status: '', urgency: '' });
  const [activeReport, setActiveReport] = useState(null);
  const [actionForm, setActionForm] = useState({ status: '', note: '' });
  const [proofFile, setProofFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setHasNew(false);
    try {
      const { data } = await adminAPI.getReports({ ...filters, limit: 50 });
      setReports(data.reports);
      setStats({
        total: data.total,
        pending: data.reports.filter(r => r.status === 'pending').length,
        inProgress: data.reports.filter(r => r.status === 'in_progress').length,
        resolved: data.reports.filter(r => r.status === 'resolved').length,
      });
    } catch { toast.error('Failed to fetch reports'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useEffect(() => {
    const handleNew = () => setHasNew(true);
    const handleStatus = ({ reportId, status }) => {
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status } : r));
    };
    on('new_report', handleNew);
    on('status_update', handleStatus);
    return () => { off('new_report', handleNew); off('status_update', handleStatus); };
  }, [on, off]);

  const handleStatusUpdate = async () => {
    if (!actionForm.status) { toast.error('Select a status'); return; }
    if (actionForm.status === 'rejected' && !actionForm.note.trim()) { toast.error('Please provide a reason for rejection'); return; }
    setActionLoading(true);
    try {
      await adminAPI.updateStatus(activeReport._id, { status: actionForm.status, note: actionForm.note });
      toast.success(`Report marked as ${actionForm.status}`);
      setActiveReport(null);
      setActionForm({ status: '', note: '' });
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setActionLoading(false); }
  };

  const handleProofUpload = async () => {
    if (!proofFile) { toast.error('Select a proof photo first'); return; }
    setActionLoading(true);
    try {
      const fd = new FormData();
      fd.append('proof', proofFile);
      await adminAPI.uploadProof(activeReport._id, fd);
      toast.success('Proof uploaded! Report marked as resolved. ✅');
      setActiveReport(null);
      setProofFile(null);
      fetchReports();
    } catch { toast.error('Failed to upload proof'); }
    finally { setActionLoading(false); }
  };

  const domainLabel = user?.adminDomain
    ? `${user.adminDomain.charAt(0).toUpperCase() + user.adminDomain.slice(1)} Admin`
    : 'Super Admin';

  return (
    <div className="page">
      {/* ─── HEADER ─── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>
            {domainLabel} — {user?.name}
            {user?.role === 'superadmin' && <span style={styles.superBadge}>⚡ Super Admin</span>}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchReports}><FiRefreshCw size={14} /> Refresh</button>
      </div>

      {/* ─── NEW REPORT ALERT ─── */}
      {hasNew && (
        <div style={styles.alertBanner} onClick={fetchReports}>
          🔔 New report received! Click to refresh.
        </div>
      )}

      {/* ─── STATS ─── */}
      <div className="grid-4" style={{ gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total', val: stats.total, icon: '📊', color: '#0f4c35', bg: '#f0fdf4' },
          { label: 'Pending', val: stats.pending, icon: '⏳', color: '#92400e', bg: '#fffbeb' },
          { label: 'In Progress', val: stats.inProgress, icon: '🔧', color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Resolved', val: stats.resolved, icon: '✅', color: '#166534', bg: '#dcfce7' },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, background: s.bg, borderColor: s.color + '30' }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ─── FILTERS ─── */}
      <div style={styles.filters}>
        <select className="form-input" style={styles.filterSel} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="pending">⏳ Pending</option>
          <option value="assigned">🔵 Assigned</option>
          <option value="in_progress">🟡 In Progress</option>
          <option value="resolved">✅ Resolved</option>
          <option value="rejected">❌ Rejected</option>
        </select>
        <select className="form-input" style={styles.filterSel} value={filters.urgency} onChange={e => setFilters(f => ({ ...f, urgency: e.target.value }))}>
          <option value="">All Urgencies</option>
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
      </div>

      {/* ─── REPORTS TABLE/CARDS ─── */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : reports.length === 0 ? (
        <div className="empty-state"><div style={{ fontSize: 40 }}>📭</div><h3>No reports</h3><p>No reports match the current filters.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map(report => (
            <div key={report._id} style={{ ...styles.reportRow, borderLeft: `4px solid ${URGENCY_COLORS[report.urgency]}` }}>
              <div style={styles.reportMain}>
                <div style={styles.reportTop}>
                  <span className={`badge badge-${report.urgency}`}>{report.urgency}</span>
                  <span className={`badge badge-${report.status}`}>{report.status.replace('_', ' ')}</span>
                  <span style={{ fontSize: 11, color: '#9ab5a5', marginLeft: 'auto' }}>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                </div>
                <h4 style={styles.reportTitle}>{report.title}</h4>
                <p style={styles.reportDesc}>{report.description?.slice(0, 100)}...</p>
                <div style={styles.reportMeta}>
                  <span>📍 {report.location}</span>
                  {report.reportedBy && <span>👤 {report.reportedBy.name} ({report.reportedBy.rollNumber || 'No roll no.'})</span>}
                  {report.reportedBy?.phone && <span>📱 {report.reportedBy.phone}</span>}
                </div>
                {report.photo?.url && <img src={report.photo.url} alt="Issue" style={styles.reportThumb} />}
              </div>
              <div style={styles.reportActions}>
                {report.status !== 'resolved' && report.status !== 'rejected' && (
                  <button className="btn btn-primary btn-sm" onClick={() => { setActiveReport(report); setActionForm({ status: '', note: '' }); }}>
                    Take Action
                  </button>
                )}
                {report.status === 'resolved' && report.proofPhoto?.url && (
                  <a href={report.proofPhoto.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">View Proof</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── ACTION MODAL ─── */}
      {activeReport && (
        <div style={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setActiveReport(null); }}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700 }}>Take Action</h3>
              <button onClick={() => setActiveReport(null)} style={styles.closeBtn}><FiX size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#6b8a78', marginBottom: 18 }}>"{activeReport.title}"</p>

            {/* Status Update */}
            <div className="form-group">
              <label className="form-label">Update Status</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {STATUS_OPTIONS.map(opt => (
                  <label key={opt.value} style={{ ...styles.statusOption, borderColor: actionForm.status === opt.value ? opt.color : '#e2e8e4', background: actionForm.status === opt.value ? opt.color + '15' : 'white' }}>
                    <input type="radio" name="status" value={opt.value} checked={actionForm.status === opt.value} onChange={e => setActionForm(f => ({ ...f, status: e.target.value }))} style={{ accentColor: opt.color }} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Note for Reporter {actionForm.status === 'rejected' ? '(Required)' : '(Optional)'}</label>
              <textarea className="form-input" rows={2} placeholder="e.g. Plumber has been called, will fix by evening..." value={actionForm.note} onChange={e => setActionForm(f => ({ ...f, note: e.target.value }))} />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }} onClick={handleStatusUpdate} disabled={actionLoading || !actionForm.status}>
              {actionLoading ? '...' : 'Update Status'}
            </button>

            <div style={styles.divider}><span>OR</span></div>

            {/* Proof Upload */}
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Upload Proof Photo (marks as Resolved)</label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setProofFile(e.target.files[0])} />
              <div className={`photo-upload-area ${proofFile ? 'has-file' : ''}`} onClick={() => fileRef.current?.click()}>
                <FiUploadCloud size={24} style={{ color: '#9ab5a5', marginBottom: 6 }} />
                <p style={{ fontSize: 13, color: proofFile ? '#0f4c35' : '#6b8a78', fontWeight: proofFile ? 600 : 400 }}>
                  {proofFile ? `✓ ${proofFile.name}` : 'Click to upload proof photo'}
                </p>
              </div>
              {proofFile && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={handleProofUpload} disabled={actionLoading}>
                  {actionLoading ? '...' : <><FiCheckCircle size={14} /> Upload Proof & Resolve</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#0d1f18', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9ab5a5', display: 'flex', alignItems: 'center', gap: 8 },
  superBadge: { background: '#fef9c3', color: '#854d0e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 },
  alertBanner: { background: '#0f4c35', color: 'white', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16 },
  statCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 20, borderRadius: 14, border: '1px solid', textAlign: 'center' },
  filters: { display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  filterSel: { width: 'auto', flex: '1 1 150px', maxWidth: 200, padding: '8px 32px 8px 12px', fontSize: 13 },
  reportRow: { background: 'white', borderRadius: 12, border: '1px solid #e2e8e4', padding: 18, display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: '0 1px 4px rgba(15,76,53,0.05)' },
  reportMain: { flex: 1 },
  reportTop: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' },
  reportTitle: { fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#0d1f18', marginBottom: 4 },
  reportDesc: { fontSize: 13, color: '#6b8a78', marginBottom: 8, lineHeight: 1.5 },
  reportMeta: { display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#9ab5a5' },
  reportThumb: { width: 80, height: 60, objectFit: 'cover', borderRadius: 8, marginTop: 10 },
  reportActions: { display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '20px' },
  modal: { background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  closeBtn: { background: 'none', border: 'none', color: '#6b8a78', cursor: 'pointer', padding: 4, borderRadius: 6 },
  statusOption: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1.5px solid', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' },
  divider: { display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0', '& span': { fontSize: 12, color: '#9ab5a5', background: 'white', padding: '0 8px' } },
};
