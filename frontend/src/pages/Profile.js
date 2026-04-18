import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiEdit2, FiList, FiLogOut } from 'react-icons/fi';

const HOSTELS = [
  { value: 'boys_hostel_1', label: 'Boys Hostel 1' },
  { value: 'boys_hostel_2', label: 'Boys Hostel 2' },
  { value: 'girls_hostel', label: 'Girls Hostel' },
  { value: 'day_scholar', label: 'Day Scholar' },
];

export default function Profile() {
  const { user, logout, loadUser } = useAuth();
  const [editing, setEditing] = useState(false);
const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', hostel: user?.hostel || '', year: user?.year || '', branch: user?.branch || '', adminDomain: user?.adminDomain || '' });  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile(form);
      await loadUser();
      toast.success('Profile updated!');
      setEditing(false);
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  if (!user) return null;

  const roleLabel = user.role === 'superadmin' ? '⚡ Super Admin' : user.role === 'admin' ? `🛡️ Admin (${user.adminDomain})` : '🎓 Student';

  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#0d1f18', marginBottom: 24 }}>My Profile</h1>

      <div className="card" style={{ padding: 28, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#0f4c35', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, flexShrink: 0 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#0d1f18' }}>{user.name}</h2>
            <p style={{ fontSize: 13, color: '#9ab5a5' }}>{user.email}</p>
            <span style={{ fontSize: 12, background: '#f0fdf4', color: '#0f4c35', padding: '2px 10px', borderRadius: 100, fontWeight: 600 }}>{roleLabel}</span>
          </div>
        </div>

        {!editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Phone', val: user.phone || 'Not set' },
...(user.role !== 'student' ? [{ label: 'Domain', val: user.adminDomain || 'Not set' }] : []),
...(user.role === 'student' ? [
  { label: 'Roll Number', val: user.rollNumber || 'Not set' },
  { label: 'Hostel', val: HOSTELS.find(h => h.value === user.hostel)?.label || 'Not set' },
  { label: 'Year', val: user.year || 'Not set' },
  { label: 'Branch', val: user.branch || 'Not set' },
] : []),
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#9ab5a5', width: 100, flexShrink: 0 }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0d1f18' }}>{item.val}</span>
              </div>
            ))}
            <button className="btn btn-outline btn-sm" style={{ marginTop: 8, alignSelf: 'flex-start' }} onClick={() => setEditing(true)}>
              <FiEdit2 size={13} /> Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number (for status updates)</label>
              <input className="form-input" placeholder="+91xxxxxxxxxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            {(user.role === 'admin' || user.role === 'superadmin') && (
  <div className="form-group">
    <label className="form-label">Admin Domain</label>
    <select className="form-input" value={form.adminDomain} onChange={e => setForm(f => ({ ...f, adminDomain: e.target.value }))}>
      <option value="">Select domain</option>
      <option value="hostel">🏠 Hostel</option>
      <option value="mess">🍽️ Mess</option>
      <option value="campus">🏛️ Campus</option>
      <option value="cleanliness">🗑️ Cleanliness</option>
      <option value="tech">📶 Tech/WiFi</option>
      <option value="ragging">🚨 Ragging</option>
      <option value="wellbeing">💬 Wellbeing</option>
    </select>
  </div>
)}        
           {user.role === 'student' && (
  <>
    <div className="grid-2" style={{ gap: 14 }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Hostel</label>
        <select className="form-input" value={form.hostel} onChange={e => setForm(f => ({ ...f, hostel: e.target.value }))}>
          <option value="">Select</option>
          {HOSTELS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
        </select>
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Year</label>
        <select className="form-input" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
          <option value="">Select</option>
          {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
    <div className="form-group" style={{ marginTop: 14 }}>
      <label className="form-label">Branch</label>
      <input className="form-input" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
    </div>
  </>
)}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>{loading ? '...' : 'Save Changes'}</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link to="/my-reports" style={styles.menuItem}><FiList size={16} /> My Reports</Link>
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <Link to="/admin" style={styles.menuItem}>🛡️ Admin Dashboard</Link>
          )}
          {user.role === 'superadmin' && (
  <Link to="/superadmin" style={styles.menuItem}>⚡ Super Admin Panel</Link>
)}

          <button onClick={() => { logout(); window.location.href = '/'; }} style={{ ...styles.menuItem, background: 'none', border: 'none', color: '#dc2626', textAlign: 'left', cursor: 'pointer' }}>
            <FiLogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  menuItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#0d1f18', textDecoration: 'none', transition: 'background 0.15s' },
};
