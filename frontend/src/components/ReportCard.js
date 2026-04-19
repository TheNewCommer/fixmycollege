import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiMapPin, FiThumbsUp, FiMessageCircle, FiClock, FiCamera } from 'react-icons/fi';
import { reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ResolutionTimer from './ResolutionTimer';

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

const BUILDING_LABELS = {
  boys_hostel_1: "Boys Hostel 1",
  boys_hostel_2: "Boys Hostel 2",
  girls_hostel: "Girls Hostel",
  main_building: "Main Building",
  mess_hall: "Mess Hall",
  campus_ground: "Campus Ground",
  library: "Library",
  lab: "Lab",
  other: "Campus",
};

export default function ReportCard({ report, onUpvote }) {
  const { user } = useAuth();
  const hasUpvoted = user && report.upvotes?.includes(user._id);

  const handleUpvote = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to upvote'); return; }
    try {
      const { data } = await reportsAPI.upvote(report._id);
      if (onUpvote) onUpvote(report._id, data.upvoteCount);
    } catch {
      toast.error('Failed to upvote');
    }
  };

  return (
    <Link to={`/reports/${report._id}`} style={{ textDecoration: 'none' }}>
      <div className="card card-hover" style={styles.card}>
        {/* ─── TOP ROW ─── */}
        <div style={styles.topRow}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`badge badge-${report.urgency}`}>
              {report.urgency === 'critical' ? '🔴' : report.urgency === 'high' ? '🟠' : report.urgency === 'medium' ? '🟡' : '🟢'} {report.urgency}
            </span>
            <span className="badge" style={{ background: '#f0fdf4', color: '#0f4c35' }}>
              {CATEGORY_LABELS[report.category] || report.category}
            </span>
          </div>
          <span className={`badge badge-${report.status}`}>
            <span className={`status-dot ${report.status}`} style={{ marginRight: 4 }} />
            {report.status.replace('_', ' ')}
          </span>
        </div>

        {/* ─── TITLE ─── */}
        <h3 style={styles.title}>{report.title}</h3>

        {/* ─── RESOLUTION TIMER ─── */}
        <div style={{ marginBottom: 8 }}>
          <ResolutionTimer
            createdAt={report.createdAt}
            status={report.status}
            urgency={report.urgency}
          />
        </div>

        <p style={styles.desc}>{report.description?.slice(0, 120)}{report.description?.length > 120 ? '...' : ''}</p>

        {/* ─── PHOTO THUMBNAIL ─── */}
        {report.photo?.url && (
          <div style={styles.photoWrap}>
            <img src={report.photo.url} alt="Issue" style={styles.photo} />
          </div>
        )}

        {/* ─── META ─── */}
        <div style={styles.meta}>
          <span style={styles.metaItem}><FiMapPin size={13} /> {report.location}</span>
          {report.building && (
            <span style={styles.metaItem}>🏢 {BUILDING_LABELS[report.building] || report.building}</span>
          )}
          <span style={styles.metaItem}><FiClock size={13} /> {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
        </div>

        {/* ─── BOTTOM ROW ─── */}
        <div style={styles.bottomRow}>
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              onClick={handleUpvote}
              style={{ ...styles.actionBtn, color: hasUpvoted ? '#0f4c35' : '#6b8a78', background: hasUpvoted ? '#f0fdf4' : 'transparent' }}
            >
              <FiThumbsUp size={14} fill={hasUpvoted ? '#0f4c35' : 'none'} />
              {report.upvoteCount || 0} upvotes
            </button>
            <span style={styles.actionBtn}>
              <FiMessageCircle size={14} />
              {report.comments?.length || 0} comments
            </span>
            {report.photo?.url && (
              <span style={{ ...styles.actionBtn, color: '#9ab5a5' }}>
                <FiCamera size={14} /> Photo
              </span>
            )}
          </div>
          {report.assignedToName && (
            <span style={styles.assignedTag}>
              👷 {report.assignedToName}
            </span>
          )}
        </div>

        {/* ─── PROOF RESOLVED ─── */}
        {report.status === 'resolved' && report.proofPhoto?.url && (
          <div style={styles.resolvedBadge}>✅ Resolved with proof</div>
        )}
      </div>
    </Link>
  );
}

const styles = {
  card: { padding: 20, cursor: 'pointer', borderRadius: 14, marginBottom: 0 },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#0d1f18', marginBottom: 6, lineHeight: 1.3 },
  desc: { fontSize: 13, color: '#6b8a78', lineHeight: 1.5, marginBottom: 12 },
  photoWrap: { borderRadius: 10, overflow: 'hidden', marginBottom: 12, height: 160 },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  meta: { display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ab5a5' },
  bottomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f2', paddingTop: 12 },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b8a78', background: 'none', border: 'none', padding: '3px 6px', borderRadius: 6, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' },
  assignedTag: { fontSize: 11, color: '#1d4ed8', background: '#dbeafe', padding: '3px 10px', borderRadius: 100, fontWeight: 600 },
  resolvedBadge: { marginTop: 10, fontSize: 12, color: '#15803d', background: '#dcfce7', padding: '5px 12px', borderRadius: 8, fontWeight: 600, textAlign: 'center' },
};
