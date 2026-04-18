import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';

const HOSTELS = [
  { value: 'boys_hostel_1', label: "Boys Hostel 1" },
  { value: 'boys_hostel_2', label: "Boys Hostel 2" },
  { value: 'girls_hostel', label: "Girls Hostel" },
  { value: 'day_scholar', label: "Day Scholar" },
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', rollNumber: '', hostel: '', year: '', branch: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Name, email and password are required'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome, ${user.name.split(' ')[0]}! Account created.`);
      navigate('/reports');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoBlock}>
          <div style={styles.logoIcon}>F</div>
          <h1 style={styles.title}>Join FixMyCollege</h1>
          <p style={styles.subtitle}>Create your student account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2" style={{ gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name *</label>
              <input className="form-input" name="name" placeholder="Your full name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Roll Number</label>
              <input className="form-input" name="rollNumber" placeholder="e.g. SEC22CS001" value={form.rollNumber} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" name="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
          </div>

          <div className="grid-2" style={{ gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" name="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm Password *</label>
              <input className="form-input" type="password" name="confirmPassword" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid-2" style={{ gap: 14, marginTop: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hostel</label>
              <select className="form-input" name="hostel" value={form.hostel} onChange={handleChange}>
                <option value="">Select hostel</option>
                {HOSTELS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Year</label>
              <select className="form-input" name="year" value={form.year} onChange={handleChange}>
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Branch</label>
            <input className="form-input" name="branch" placeholder="e.g. Computer Science" value={form.branch} onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Creating account...</>
              : <><FiUserPlus /> Create Account</>}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account? <Link to="/login" style={{ color: '#0f4c35', fontWeight: 600 }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', background: 'linear-gradient(135deg, #f0fdf4 0%, #f8faf9 100%)' },
  card: { background: 'white', borderRadius: 20, padding: '36px', width: '100%', maxWidth: 520, boxShadow: '0 8px 40px rgba(15,76,53,0.12)', border: '1px solid #e2e8e4' },
  logoBlock: { textAlign: 'center', marginBottom: 24 },
  logoIcon: { width: 48, height: 48, borderRadius: 14, background: '#0f4c35', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, margin: '0 auto 12px' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#0d1f18', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9ab5a5' },
  switchText: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b8a78' },
};
