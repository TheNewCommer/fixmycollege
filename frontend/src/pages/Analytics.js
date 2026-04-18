import React, { useState, useEffect } from 'react';
import { statsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { FiBarChart2, FiTrendingUp, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const COLORS = ['#0f4c35', '#f4a621', '#dc2626', '#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2', '#374151'];

const CATEGORY_LABELS = {
  cleanliness: 'Cleanliness', hostel_infrastructure: 'Hostel', mess: 'Mess',
  campus_infrastructure: 'Campus', electricity: 'Electricity', water: 'Water',
  internet_tech: 'Tech/WiFi', security: 'Security', other_civic: 'Other',
};

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8e4', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => <p key={i} style={{ fontSize: 12, color: p.color }}>{p.name}: {p.value}</p>)}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.get()
      .then(({ data }) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Loading analytics...</p></div>;
  if (!stats) return <div className="empty-state"><h3>Failed to load analytics</h3></div>;

  const categoryData = stats.categoryStats?.map(c => ({
    name: CATEGORY_LABELS[c._id] || c._id,
    count: c.count,
  })) || [];

  const urgencyData = [
    { name: '🔴 Critical', value: stats.urgencyStats?.find(u => u._id === 'critical')?.count || 0 },
    { name: '🟠 High', value: stats.urgencyStats?.find(u => u._id === 'high')?.count || 0 },
    { name: '🟡 Medium', value: stats.urgencyStats?.find(u => u._id === 'medium')?.count || 0 },
    { name: '🟢 Low', value: stats.urgencyStats?.find(u => u._id === 'low')?.count || 0 },
  ].filter(d => d.value > 0);

  const weeklyData = stats.weeklyTrend?.map(d => ({
    date: d._id?.slice(5),
    reports: d.count,
  })) || [];

  const statusData = [
    { name: 'Pending', value: stats.pendingReports || 0, color: '#9ca3af' },
    { name: 'Resolved', value: stats.resolvedReports || 0, color: '#22c55e' },
    { name: 'In Progress', value: stats.inProgressReports || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <div className="page">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics</h1>
          <p style={styles.subtitle}>Real-time campus issue statistics</p>
        </div>
      </div>

      {/* ─── TOP METRICS ─── */}
      <div className="grid-4" style={{ gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Reports', value: stats.totalReports, icon: <FiAlertCircle />, color: '#0f4c35', bg: '#f0fdf4' },
          { label: 'Resolved', value: stats.resolvedReports, icon: <FiCheckCircle />, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Resolution Rate', value: `${stats.resolutionRate}%`, icon: <FiTrendingUp />, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Active Students', value: stats.totalUsers, icon: <FiBarChart2 />, color: '#7c3aed', bg: '#f5f3ff' },
        ].map(m => (
          <div key={m.label} style={{ ...styles.metricCard, background: m.bg, borderColor: m.color + '25' }}>
            <div style={{ ...styles.metricIcon, background: m.color, color: 'white' }}>{m.icon}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 12, color: m.color, fontWeight: 600 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* ─── CATEGORY BAR CHART ─── */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={styles.chartTitle}>Reports by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f2" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Bar dataKey="count" fill="#0f4c35" radius={[6, 6, 0, 0]} name="Reports">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No data yet</p></div>}
        </div>

        {/* ─── URGENCY PIE CHART ─── */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={styles.chartTitle}>Urgency Distribution</h3>
          {urgencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={urgencyData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {urgencyData.map((_, i) => <Cell key={i} fill={['#dc2626', '#ea580c', '#d97706', '#16a34a'][i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No data yet</p></div>}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* ─── WEEKLY TREND ─── */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={styles.chartTitle}>Weekly Trend (Last 7 Days)</h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f2" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Line type="monotone" dataKey="reports" stroke="#0f4c35" strokeWidth={2.5} dot={{ fill: '#0f4c35', r: 4 }} name="Reports" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No data yet</p></div>}
        </div>

        {/* ─── STATUS OVERVIEW ─── */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={styles.chartTitle}>Resolution Status</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                {statusData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                    {d.name}: <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No data yet</p></div>}

          {/* ─── RECENT RESOLVED ─── */}
          {stats.recentActivity?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0d1f18', marginBottom: 10 }}>Recently Resolved</h4>
              {stats.recentActivity.map((r, i) => (
                <div key={i} style={styles.recentItem}>
                  <span style={{ fontSize: 12 }}>✅</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#0d1f18' }}>{r.title}</p>
                    <p style={{ fontSize: 11, color: '#9ab5a5' }}>{CATEGORY_LABELS[r.category] || r.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: { marginBottom: 24 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#0d1f18', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9ab5a5' },
  metricCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 16px', borderRadius: 14, border: '1px solid', textAlign: 'center' },
  metricIcon: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  chartTitle: { fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#0d1f18', marginBottom: 16 },
  recentItem: { display: 'flex', gap: 8, alignItems: 'flex-start', paddingBottom: 8, borderBottom: '1px solid #f1f5f2', marginBottom: 8 },
};
