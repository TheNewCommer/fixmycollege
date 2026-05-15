import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import MyReportCard from '../components/MyReportCard';
import { FiPlus, FiCheckCircle, FiClock, FiRefreshCw } from 'react-icons/fi';

export function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsAPI.getMyReports()
      .then(({ data }) => setReports(data.reports))
      .finally(() => setLoading(false));
  }, []);

  const pending = reports.filter(r => r.status === 'pending').length;
  const inProgress = reports.filter(r => r.status === 'in_progress' || r.status === 'assigned').length;
  const resolved = reports.filter(r => r.status === 'resolved').length;

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="page" style={{ maxWidth: 780, margin: '0 auto' }}>

      {/* ─── HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#0d1f18', marginBottom: 4 }}>My Reports</h1>
          <p style={{ fontSize: 14, color: '#9ab5a5' }}>{reports.length} reports submitted by you</p>
        </div>
        <Link to="/submit" className="btn btn-primary"><FiPlus /> New Report</Link>
      </div>

      {/* ─── MINI STATS ─── */}
      {reports.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div style={statCard('#f3f4f6', '#6b7280')}>
            <FiClock size={14} /> <strong>{pending}</strong> Pending
          </div>
          <div style={statCard('#fef3c7', '#d97706')}>
            <FiRefreshCw size={14} /> <strong>{inProgress}</strong> In Progress
          </div>
          <div style={statCard('#dcfce7', '#15803d')}>
            <FiCheckCircle size={14} /> <strong>{resolved}</strong> Resolved
          </div>
        </div>
      )}

      {/* ─── REPORT LIST ─── */}
      {reports.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3>No reports yet</h3>
          <p>You haven't submitted any reports yet. Help improve campus!</p>
          <Link to="/submit" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}><FiPlus /> Submit First Report</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map(r => <MyReportCard key={r._id} report={r} />)}
        </div>
      )}
    </div>
  );
}

const statCard = (bg, color) => ({
  flex: 1, display: 'flex', alignItems: 'center', gap: 6,
  background: bg, borderRadius: 10, padding: '10px 14px',
  fontSize: 13, color, fontWeight: 500,
});

export default MyReports;
