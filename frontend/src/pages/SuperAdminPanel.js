import React, { useState, useEffect } from 'react';
import { adminAPI, wellbeingAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiShield, FiUsers, FiEye } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const DOMAINS = ['hostel', 'mess', 'campus', 'cleanliness', 'tech', 'ragging', 'wellbeing'];

export default function SuperAdminPanel() {
  const [tab, setTab] = useState('team');
  const [admins, setAdmins] = useState([]);
  const [raggingPosts, setRaggingPosts] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', adminDomain: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (tab === 'team') adminAPI.getTeam().then(({ data }) => setAdmins(data.admins)).catch(() => toast.error('Failed to load team'));
    if (tab === 'ragging') wellbeingAPI.getRaggingPosts().then(({ data }) => setRaggingPosts(data.posts)).catch(() => toast.error('Failed to load ragging reports'));
  }, [tab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.adminDomain) { toast.error('All fields required'); return; }
    setLoading(true);
    try {
      await adminAPI.createAdmin(form);
      toast.success(`Admin account created for ${form.name}!`);
      setForm({ name: '', email: '', password: '', adminDomain: '', phone: '' });
      setCreating(false);
      adminAPI.getTeam().then(({ data }) => setAdmins(data.admins));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create admin'); }
    finally { setLoading(false); }
  };

  const handleAcknowledge = async (id) => {
    try {
      await wellbeingAPI.acknowledgeRagging(id);
      toast.success('Ragging report acknowledged. Take action immediately.');
      setRaggingPosts(prev => prev.map(p => p._id === id ? { ...p, isAcknowledged: true, status: 'in_review' } : p));
    } catch { toast.error('Failed to acknowledge'); }
  };

  return (
    <div className="page">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>⚡ Super Admin Panel</h1>
          <p style={styles.subtitle}>Manage the entire FixMyCollege system</p>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div style={styles.tabs}>
        {[
          { key: 'team', label: <><FiUsers size={14} /> Admin Team</>, },
          { key: 'ragging', label: <><FiShield size={14} /> Ragging Reports</>, },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ ...styles.tab, ...(tab === t.key ? styles.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TEAM TAB ─── */}
      {tab === 'team' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setCreating(c => !c)}>
              <FiPlus size={14} /> {creating ? 'Cancel' : 'Add Admin'}
            </button>
          </div>

          {creating && (
            <div className="card slide-up" style={{ padding: 24, marginBottom: 20, borderTop: '3px solid #0f4c35' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create Admin Account</h3>
              <form onSubmit={handleCreate}>
                <div className="grid-2" style={{ gap: 14 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" placeholder="Friend's name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" placeholder="their@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Password *</label>
                    <input className="form-input" type="password" placeholder="Set a password for them" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Phone (for SMS alerts) *</label>
                    <input className="form-input" placeholder="+91xxxxxxxxxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Admin Domain *</label>
                    <select className="form-input" value={form.adminDomain} onChange={e => setForm(f => ({ ...f, adminDomain: e.target.value }))} required>
                      <option value="">Select domain</option>
                      {DOMAINS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loading}>
                  {loading ? '...' : <><FiPlus size={14} /> Create Admin Account</>}
                </button>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {admins.map(admin => (
              <div key={admin._id} className="card" style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: admin.role === 'superadmin' ? '#f4a621' : '#0f4c35', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {admin.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0d1f18' }}>{admin.name}</div>
                  <div style={{ fontSize: 12, color: '#9ab5a5' }}>{admin.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {admin.adminDomain && <span style={{ fontSize: 12, background: '#f0fdf4', color: '#0f4c35', padding: '3px 10px', borderRadius: 100, fontWeight: 600 }}>{admin.adminDomain}</span>}
                  <span style={{ fontSize: 11, background: admin.role === 'superadmin' ? '#fef9c3' : '#eff6ff', color: admin.role === 'superadmin' ? '#854d0e' : '#1d4ed8', padding: '3px 10px', borderRadius: 100, fontWeight: 600 }}>{admin.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── RAGGING TAB ─── */}
      {tab === 'ragging' && (
        <div>
          <div style={styles.raggingWarning}>
            <FiShield size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: 14, color: '#dc2626' }}>PRIVATE & CONFIDENTIAL</strong>
              <p style={{ fontSize: 13, color: '#6b8a78', marginTop: 4 }}>These reports are only visible to you (Super Admin) and the Ragging Admin. Handle with absolute confidentiality and take immediate action where required.</p>
            </div>
          </div>

          {raggingPosts.length === 0 ? (
            <div className="empty-state"><div style={{ fontSize: 40 }}>✅</div><h3>No ragging reports</h3><p>No ragging incidents have been reported.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              {raggingPosts.map(post => (
                <div key={post._id} style={{ ...styles.raggingCard, opacity: post.isAcknowledged ? 0.7 : 1 }}>
                  <div style={styles.raggingTop}>
                    <span style={{ fontSize: 12, color: '#9ab5a5' }}>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    {post.isAcknowledged
                      ? <span style={{ fontSize: 12, background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 100, fontWeight: 600 }}>✅ Acknowledged</span>
                      : <span style={{ fontSize: 12, background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: 100, fontWeight: 600 }}>🔴 Action Required</span>}
                  </div>
                  <p style={{ fontSize: 14, color: '#0d1f18', lineHeight: 1.7, marginBottom: 14 }}>{post.content}</p>
                  {!post.isAcknowledged && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleAcknowledge(post._id)}>
                      <FiShield size={13} /> Acknowledge & Take Action
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { marginBottom: 24 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#0d1f18', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9ab5a5' },
  tabs: { display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e2e8e4', paddingBottom: 0 },
  tab: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'none', border: 'none', fontSize: 14, fontWeight: 500, color: '#6b8a78', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -2, transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif' },
  tabActive: { color: '#0f4c35', borderBottomColor: '#0f4c35', fontWeight: 700 },
  raggingWarning: { display: 'flex', gap: 12, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '16px 18px', marginBottom: 16 },
  raggingCard: { background: 'white', border: '2px solid #fca5a5', borderRadius: 12, padding: 20 },
  raggingTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
};
