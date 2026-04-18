import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiThumbsUp, FiSend, FiMapPin, FiClock, FiActivity } from 'react-icons/fi';

const CATEGORY_LABELS = {
  cleanliness: '🗑️ Cleanliness', hostel_infrastructure: '🏠 Hostel Infrastructure',
  mess: '🍽️ Mess', campus_infrastructure: '🏛️ Campus', electricity: '⚡ Electricity',
  water: '💧 Water', internet_tech: '📶 Tech/WiFi', security: '🔒 Security', other_civic: '📌 Other',
};

const STATUS_STEPS = ['pending', 'assigned', 'in_progress', 'resolved'];

export default function ReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    reportsAPI.getOne(id)
      .then(({ data }) => setReport(data.report))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpvote = async () => {
    if (!user) { toast.error('Please login to upvote'); return; }
    try {
      const { data } = await reportsAPI.upvote(id);
      setReport(r => ({ ...r, upvoteCount: data.upvoteCount, upvotes: data.upvoted ? [...(r.upvotes || []), user._id] : (r.upvotes || []).filter(u => u !== user._id) }));
    } catch { toast.error('Failed to upvote'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    if (!user) { toast.error('Please login to comment'); return; }
    setSubmitting(true);
    try {
      const { data } = await reportsAPI.addComment(id, comment.trim());
      setReport(r => ({ ...r, comments: data.comments }));
      setComment('');
      toast.success('Comment added!');
    } catch { toast.error('Failed to add comment'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!report) return <div className="empty-state"><h3>Report not found</h3><Link to="/reports" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>Back to Reports</Link></div>;

  const hasUpvoted = user && report.upvotes?.includes(user._id);
  const currentStep = STATUS_STEPS.indexOf(report.status);

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <Link to="/reports" style={styles.back}><FiArrowLeft size={16} /> Back to Reports</Link>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        {/* ─── TOP ─── */}
        <div style={styles.topRow}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`badge badge-${report.urgency}`}>{report.urgency}</span>
            <span className="badge" style={{ background: '#f0fdf4', color: '#0f4c35' }}>{CATEGORY_LABELS[report.category]}</span>
          </div>
          <span className={`badge badge-${report.status}`}>
            <span className={`status-dot ${report.status}`} style={{ marginRight: 5 }} />
            {report.status.replace('_', ' ')}
          </span>
        </div>

        <h1 style={styles.title}>{report.title}</h1>

        {/* ─── STATUS PROGRESS ─── */}
        {report.status !== 'rejected' && (
          <div style={styles.progressWrap}>
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div style={styles.progressStep}>
                  <div style={{ ...styles.progressDot, background: i <= currentStep ? '#0f4c35' : '#e2e8e4', border: i === currentStep ? '3px solid #f4a621' : 'none' }}>
                    {i < currentStep && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
                  </div>
                  <span style={{ ...styles.progressLabel, color: i <= currentStep ? '#0f4c35' : '#9ab5a5', fontWeight: i === currentStep ? 700 : 400 }}>
                    {step.replace('_', ' ')}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < currentStep ? '#0f4c35' : '#e2e8e4', marginBottom: 20 }} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ─── PHOTO ─── */}
        {report.photo?.url && (
          <div style={styles.photoWrap}>
            <img src={report.photo.url} alt="Issue" style={styles.photo} />
            <div style={styles.photoLabel}>📸 Issue Photo</div>
          </div>
        )}

        <p style={styles.desc}>{report.description}</p>

        <div style={styles.metaRow}>
          <span style={styles.metaItem}><FiMapPin size={13} /> {report.location}</span>
          <span style={styles.metaItem}><FiClock size={13} /> {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
          {report.isAnonymous ? <span style={styles.metaItem}>👤 Anonymous</span> : <span style={styles.metaItem}>👤 {report.reportedBy?.name}</span>}
        </div>

        {/* ─── AUTHORITY ASSIGNMENT ─── */}
        {report.assignedToName && (
          <div style={styles.assignBox}>
            <span>👷 Assigned to: <strong>{report.assignedToName}</strong></span>
            {report.assignNote && <p style={{ fontSize: 13, color: '#3d5a4a', marginTop: 4 }}>"{report.assignNote}"</p>}
          </div>
        )}

        {/* ─── PROOF PHOTO ─── */}
        {report.proofPhoto?.url && (
          <div style={{ ...styles.photoWrap, marginTop: 16 }}>
            <img src={report.proofPhoto.url} alt="Proof" style={styles.photo} />
            <div style={{ ...styles.photoLabel, background: 'rgba(21,128,61,0.85)' }}>✅ Resolution Proof</div>
          </div>
        )}

        {/* ─── UPVOTE ─── */}
        <div style={styles.actions}>
          <button onClick={handleUpvote} style={{ ...styles.upvoteBtn, background: hasUpvoted ? '#0f4c35' : 'white', color: hasUpvoted ? 'white' : '#0f4c35', border: `1.5px solid ${hasUpvoted ? '#0f4c35' : '#c8d4cc'}` }}>
            <FiThumbsUp size={15} fill={hasUpvoted ? 'white' : 'none'} />
            {report.upvoteCount || 0} {report.upvoteCount === 1 ? 'Upvote' : 'Upvotes'}
          </button>
          <span style={{ fontSize: 13, color: '#9ab5a5' }}>Help prioritise this issue by upvoting</span>
        </div>
      </div>

      {/* ─── ACTIVITY TIMELINE ─── */}
      {report.activities?.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={styles.sectionTitle}><FiActivity size={16} /> Activity Timeline</h3>
          <div style={{ marginTop: 16 }}>
            {report.activities.map((act, i) => (
              <div key={i} style={styles.activityItem}>
                <div style={styles.activityDot} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1f18' }}>{act.action}</p>
                  {act.note && <p style={{ fontSize: 12, color: '#6b8a78', marginTop: 2 }}>{act.note}</p>}
                  <p style={{ fontSize: 11, color: '#9ab5a5', marginTop: 2 }}>
                    {act.performedByName || 'System'} · {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── COMMENTS ─── */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={styles.sectionTitle}>💬 Comments ({report.comments?.length || 0})</h3>

        {user ? (
          <form onSubmit={handleComment} style={styles.commentForm}>
            <input className="form-input" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} maxLength={500} />
            <button type="submit" className="btn btn-primary" disabled={submitting || !comment.trim()}>
              <FiSend size={14} /> {submitting ? '...' : 'Post'}
            </button>
          </form>
        ) : (
          <div style={styles.loginPrompt}>
            <Link to="/login" style={{ color: '#0f4c35', fontWeight: 600 }}>Login</Link> to add a comment.
          </div>
        )}

        {report.comments?.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ab5a5', marginTop: 16, textAlign: 'center' }}>No comments yet. Be the first to comment!</p>
        ) : (
          <div style={{ marginTop: 16 }}>
            {report.comments.map((c, i) => (
              <div key={i} style={styles.comment}>
                <div style={styles.commentAvatar}>{c.authorName?.charAt(0)?.toUpperCase() || '?'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0d1f18' }}>{c.authorName || 'Anonymous'}</span>
                    {c.isAdminComment && <span style={{ fontSize: 10, background: '#0f4c35', color: 'white', padding: '1px 7px', borderRadius: 100 }}>Admin</span>}
                    <span style={{ fontSize: 11, color: '#9ab5a5' }}>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#3d5a4a', lineHeight: 1.5 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b8a78', fontSize: 13, fontWeight: 500, marginBottom: 20, textDecoration: 'none' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#0d1f18', marginBottom: 20, lineHeight: 1.3 },
  progressWrap: { display: 'flex', alignItems: 'center', marginBottom: 24 },
  progressStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  progressDot: { width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  progressLabel: { fontSize: 11, fontWeight: 500, textTransform: 'capitalize', whiteSpace: 'nowrap' },
  photoWrap: { borderRadius: 12, overflow: 'hidden', height: 260, position: 'relative', marginBottom: 20 },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  photoLabel: { position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 600 },
  desc: { fontSize: 15, color: '#3d5a4a', lineHeight: 1.7, marginBottom: 16 },
  metaRow: { display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#9ab5a5' },
  assignBox: { background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#1d4ed8', marginBottom: 16 },
  actions: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 },
  upvoteBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  sectionTitle: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#0d1f18', display: 'flex', alignItems: 'center', gap: 8 },
  activityItem: { display: 'flex', gap: 14, paddingBottom: 16, borderLeft: '2px solid #e2e8e4', paddingLeft: 16, position: 'relative', marginLeft: 8 },
  activityDot: { position: 'absolute', left: -5, top: 4, width: 8, height: 8, borderRadius: '50%', background: '#0f4c35', flexShrink: 0 },
  commentForm: { display: 'flex', gap: 10, marginBottom: 4 },
  loginPrompt: { padding: '12px 14px', background: '#f8faf9', borderRadius: 10, fontSize: 13, color: '#6b8a78', marginBottom: 4 },
  comment: { display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f2' },
  commentAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#f0fdf4', color: '#0f4c35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, border: '1px solid #c8d4cc' },
};
