import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiMapPin, FiClock, FiThumbsUp, FiMessageCircle, FiChevronRight } from 'react-icons/fi';

const CATEGORY_LABELS = {
  cleanliness: '🗑️ Cleanliness',
  hostel_infrastructure: '🏠 Hostel',
  mess: '🍽️ Mess',
  campus_infrastructure: '🏛️ Campus',
  electricity: '⚡ Electricity',
  water: '💧 Water',
  internet_tech: '📶 Tech/WiFi',
  security: '🔒 Security',
  other_civic: '📌 Other',
};

const STATUS_STYLES = {
  pending:     { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: 'Pending' },
  assigned:    { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6', label: 'Assigned' },
  in_progress: { bg: '#fef3c7', color: '#d97706', dot: '#f59e0b', label: 'In Progress' },
  resolved:    { bg: '#dcfce7', color: '#15803d', dot: '#22c55e', label: 'Resolved' },
  rejected:    { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444', label: 'Rejected' },
};

const URGENCY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#16a34a',
};

export default function MyReportCard({ report }) {
  const status = STATUS_STYLES[report.status] || STATUS_STYLES.pending;
  const urgencyColor = URGENCY_COLORS[report.urgency] || '#d97706';

  return (
    <Link to={`/reports/${report._id}`} style={{ textDecoration: 'none' }}>
      <div style={styles.card}>
        {/* Left urgency stripe */}
        <div style={{ ...styles.stripe, background: urgencyColor }} />

        {/* Thumbnail if photo exists */}
        {report.photo?.url && (
          <img src={report.photo.url} alt="issue" style={styles.thumb} />
        )}

        {/* Main content */}
        <div style={styles.content}>
          <div style={styles.topRow}>
            <span style={{ fontSize: 12, color: '#9ab5a5', fontWeight: 500 }}>
              {CATEGORY_LABELS[report.category] || report.category}
            </span>
            <span style={{ ...styles.statusBadge, background: status.bg, color: status.color }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.dot, flexShrink: 0 }} />
              {status.label}
            </span>
          </div>

          <h3 style={styles.title}>{report.title}</h3>

          <div style={styles.meta}>
            <span style={styles.metaItem}>
              <FiMapPin size={11} /> {report.location}
            </span>
            <span style={styles.metaItem}>
              <FiClock size={11} /> {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
            </span>
          </div>

          <div style={styles.bottomRow}>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={styles.stat}><FiThumbsUp size={11} /> {report.upvoteCount || 0}</span>
              <span style={styles.stat}><FiMessageCircle size={11} /> {report.comments?.length || 0}</span>
              {report.status === 'resolved' && report.proofPhoto?.url && (
                <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>✅ Proof uploaded</span>
              )}
            </div>
            <span style={{ ...styles.urgencyTag, color: urgencyColor, borderColor: urgencyColor }}>
              {report.urgency}
            </span>
          </div>
        </div>

        <FiChevronRight size={16} style={{ color: '#c8d4cc', flexShrink: 0, marginLeft: 4 }} />
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: 'flex', alignItems: 'center', gap: 0,
    background: 'white', border: '1.5px solid #e8f0ec',
    borderRadius: 14, overflow: 'hidden',
    transition: 'box-shadow 0.2s, transform 0.2s',
    cursor: 'pointer', marginBottom: 0,
    boxShadow: '0 1px 4px rgba(15,76,53,0.05)',
  },
  stripe: { width: 4, alignSelf: 'stretch', flexShrink: 0 },
  thumb: { width: 72, height: 72, objectFit: 'cover', flexShrink: 0 },
  content: { flex: 1, padding: '12px 14px', minWidth: 0 },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statusBadge: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#0d1f18', marginBottom: 6, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  meta: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ab5a5' },
  bottomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stat: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ab5a5' },
  urgencyTag: { fontSize: 10, fontWeight: 700, border: '1px solid', padding: '1px 7px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 0.5 },
};
