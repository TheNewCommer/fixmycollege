import React, { useState, useEffect } from 'react';
import { FiClock, FiAlertTriangle } from 'react-icons/fi';

export default function ResolutionTimer({ createdAt, status, urgency }) {
  const [timeInfo, setTimeInfo] = useState(null);

  useEffect(() => {
    const calculate = () => {
      if (status === 'resolved' || status === 'rejected') {
        setTimeInfo(null);
        return;
      }

      const now = new Date();
      const created = new Date(createdAt);
      const diffMs = now - created;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      let timeText = '';
      if (diffMinutes < 60) {
        timeText = `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        timeText = `${diffHours}h unresolved`;
      } else {
        timeText = `${diffDays}d unresolved`;
      }

      // Determine urgency level based on time + issue urgency
      let level = 'normal'; // green
      if (urgency === 'critical') {
        if (diffHours >= 4) level = 'danger';
        else if (diffHours >= 1) level = 'warning';
      } else if (urgency === 'high') {
        if (diffHours >= 24) level = 'danger';
        else if (diffHours >= 8) level = 'warning';
      } else if (urgency === 'medium') {
        if (diffDays >= 3) level = 'danger';
        else if (diffDays >= 1) level = 'warning';
      } else {
        if (diffDays >= 7) level = 'warning';
      }

      setTimeInfo({ timeText, level, diffHours, diffDays });
    };

    calculate();
    const interval = setInterval(calculate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [createdAt, status, urgency]);

  if (!timeInfo) return null;

  const colors = {
    normal: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    warning: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    danger: { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
  };

  const c = colors[timeInfo.level];

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 100,
      background: c.bg,
      border: `1px solid ${c.border}`,
      fontSize: 12,
      fontWeight: 600,
      color: c.color,
    }}>
      {timeInfo.level === 'danger'
        ? <FiAlertTriangle size={11} style={{ animation: 'pulse 1.5s infinite' }} />
        : <FiClock size={11} />}
      {timeInfo.timeText}
      {timeInfo.level === 'danger' && ' ⚠️'}
    </div>
  );
}
