// ─── MY REPORTS PAGE ─────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import ReportCard from '../components/ReportCard';
import { FiPlus } from 'react-icons/fi';

export function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsAPI.getMyReports()
      .then(({ data }) => setReports(data.reports))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#0d1f18', marginBottom: 4 }}>My Reports</h1>
          <p style={{ fontSize: 14, color: '#9ab5a5' }}>{reports.length} reports submitted by you</p>
        </div>
        <Link to="/submit" className="btn btn-primary"><FiPlus /> New Report</Link>
      </div>
      {reports.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3>No reports yet</h3>
          <p>You haven't submitted any reports. Help improve campus by reporting an issue!</p>
          <Link to="/submit" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}><FiPlus /> Submit First Report</Link>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: 16 }}>
          {reports.map(r => <ReportCard key={r._id} report={r} />)}
        </div>
      )}
    </div>
  );
}

export default MyReports;
