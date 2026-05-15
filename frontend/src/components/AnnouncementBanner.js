import React, { useState, useEffect } from 'react';
import { announcementsAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiX, FiAlertTriangle, FiCheckCircle, FiInfo, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TYPE_STYLES = {
  info:    { bg: '#eff6ff', border: '#3b82f6', icon: <FiInfo size={16} />,          color: '#1d4ed8', label: 'Info' },
  warning: { bg: '#fffbeb', border: '#f59e0b', icon: <FiAlertTriangle size={16} />, color: '#d97706', label: 'Warning' },
  success: { bg: '#f0fdf4', border: '#22c55e', icon: <FiCheckCircle size={16} />,   color: '#16a34a', label: 'Notice' },
  urgent:  { bg: '#fef2f2', border: '#ef4444', icon: <FiZap size={16} />,           color: '#dc2626', label: 'Urgent' },
};

export default function AnnouncementBanner() {
  const { user, isAdmin } = useAuth();
  const { on, off } = useSocket();
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fmc_dismissed_announcements') || '[]'); }
    catch { return []; }
  });

  const fetchAnnouncements = () => {
    announcementsAPI.getAll()
      .then(({ data }) => setAnnouncements(data.announcements))
      .catch(() => {});
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  // Real-time new announcement
  useEffect(() => {
    const handleNew = (announcement) => {
      setAnnouncements(prev => [announcement, ...prev]);
      toast('📢 New announcement posted!', { icon: '🔔' });
    };
    on('new_announcement', handleNew);
    return () => off('new_announcement', handleNew);
  }, [on, off]);

  const handleDismiss = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('fmc_dismissed_announcements', JSON.stringify(updated));
  };

  const handleAdminDelete = async (id) => {
    try {
      await announcementsAPI.delete(id);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      toast.success('Announcement removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const visible = announcements.filter(a => !dismissed.includes(a._id));
  if (visible.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
      {visible.map(a => {
        const style = TYPE_STYLES[a.type] || TYPE_STYLES.info;
        return (
          <div key={a._id} style={{
            background: style.bg,
            border: `1.5px solid ${style.border}`,
            borderLeft: `4px solid ${style.border}`,
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <span style={{ color: style.color, marginTop: 2, flexShrink: 0 }}>{style.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: style.color }}>{style.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0d1f18' }}>{a.title}</span>
              </div>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, margin: 0 }}>{a.content}</p>
              <span style={{ fontSize: 11, color: '#9ab5a5', marginTop: 4, display: 'block' }}>
                Posted by {a.postedByName} · {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {isAdmin ? (
              <button onClick={() => handleAdminDelete(a._id)} style={styles.closeBtn} title="Remove announcement">
                <FiX size={15} />
              </button>
            ) : (
              <button onClick={() => handleDismiss(a._id)} style={styles.closeBtn} title="Dismiss">
                <FiX size={15} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#9ab5a5', padding: 4, borderRadius: 6,
    display: 'flex', alignItems: 'center', flexShrink: 0,
  },
};
