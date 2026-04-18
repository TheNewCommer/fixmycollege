import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' || user.role === 'superadmin' ? '/admin' : '/reports');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoBlock}>
          <div style={styles.logoIcon}>F</div>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Login to FixMyCollege</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={styles.inputWrap}>
              <FiMail size={15} style={styles.inputIcon} />
              <input className="form-input" style={{ paddingLeft: 38 }} type="email" name="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={styles.inputWrap}>
              <FiLock size={15} style={styles.inputIcon} />
              <input className="form-input" style={{ paddingLeft: 38 }} type="password" name="password" placeholder="Your password" value={form.password} onChange={handleChange} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Logging in...</> : <><FiLogIn /> Login</>}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account? <Link to="/register" style={{ color: '#0f4c35', fontWeight: 600 }}>Register here</Link>
        </p>

        <div style={styles.anonNote}>
          💡 You can also <Link to="/reports" style={{ color: '#0f4c35' }}>browse reports</Link> or <Link to="/wellbeing" style={{ color: '#0f4c35' }}>post anonymously</Link> without logging in.
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', background: 'linear-gradient(135deg, #f0fdf4 0%, #f8faf9 100%)' },
  card: { background: 'white', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(15,76,53,0.12)', border: '1px solid #e2e8e4' },
  logoBlock: { textAlign: 'center', marginBottom: 28 },
  logoIcon: { width: 52, height: 52, borderRadius: 14, background: '#0f4c35', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, margin: '0 auto 14px' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#0d1f18', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9ab5a5' },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ab5a5', pointerEvents: 'none' },
  switchText: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b8a78' },
  anonNote: { marginTop: 16, padding: '12px 14px', background: '#f8faf9', borderRadius: 10, fontSize: 13, color: '#6b8a78', lineHeight: 1.5, textAlign: 'center' },
};
