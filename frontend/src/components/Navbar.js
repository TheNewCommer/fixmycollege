import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import {
  FiHome, FiAlertCircle, FiHeart, FiBarChart2,
  FiPlusCircle, FiUser, FiLogOut, FiMenu, FiX,
  FiShield, FiList, FiWifi, FiWifiOff
} from 'react-icons/fi';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { connected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/reports', icon: <FiAlertCircle />, label: 'Civic Issues' },
    { to: '/wellbeing', icon: <FiHeart />, label: 'Wellbeing' },
    { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* ─── LOGO ─── */}
        <Link to="/" style={styles.logo} onClick={() => setMenuOpen(false)}>
          <div style={styles.logoIcon}>F</div>
          <div>
            <span style={styles.logoText}>FixMy<span style={{ color: '#f4a621' }}>College</span></span>
            <span style={styles.logoSub}>Sershah Engineering College</span>
          </div>
        </Link>

        {/* ─── DESKTOP LINKS ─── */}
        <div style={styles.links}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{ ...styles.link, ...(isActive(link.to) ? styles.linkActive : {}) }}
            >
              {link.icon} {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" style={{ ...styles.link, ...(isActive('/admin') ? styles.linkActive : {}), color: '#f4a621' }}>
              <FiShield /> Admin
            </Link>
          )}
        </div>

        {/* ─── RIGHT SIDE ─── */}
        <div style={styles.right}>
          {/* Real-time indicator */}
          <div style={{ ...styles.liveIndicator, color: connected ? '#16a34a' : '#9ca3af' }} title={connected ? 'Live' : 'Connecting...'}>
            {connected ? <FiWifi size={14} /> : <FiWifiOff size={14} />}
            <span style={{ fontSize: 11, fontWeight: 600 }}>{connected ? 'LIVE' : '...'}</span>
          </div>

          {user ? (
            <>
              <Link to="/submit" style={styles.submitBtn}>
                <FiPlusCircle size={15} /> Report Issue
              </Link>
              <div style={styles.userMenu}>
                <Link to="/profile" style={styles.avatar} title={user.name}>
                  {user.name.charAt(0).toUpperCase()}
                </Link>
                <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
                  <FiLogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" style={styles.loginBtn}>Login</Link>
              <Link to="/register" style={styles.registerBtn}>Register</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button style={styles.menuBtn} onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* ─── MOBILE MENU ─── */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              {link.icon} {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" style={{ ...styles.mobileLink, color: '#f4a621' }} onClick={() => setMenuOpen(false)}>
              <FiShield /> Admin Dashboard
            </Link>
          )}
          <div style={styles.mobileDivider} />
          {user ? (
            <>
              <Link to="/submit" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                <FiPlusCircle /> Report an Issue
              </Link>
              <Link to="/my-reports" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                <FiList /> My Reports
              </Link>
              <Link to="/profile" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                <FiUser /> Profile
              </Link>
              <button style={{ ...styles.mobileLink, background: 'none', border: 'none', width: '100%', textAlign: 'left', color: '#dc2626' }} onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.mobileLink} onClick={() => setMenuOpen(false)}><FiUser /> Login</Link>
              <Link to="/register" style={styles.mobileLink} onClick={() => setMenuOpen(false)}><FiPlusCircle /> Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #e2e8e4',
    boxShadow: '0 1px 8px rgba(15,76,53,0.07)',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 20px',
    height: 64, display: 'flex', alignItems: 'center', gap: 20,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: '#0f4c35', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18,
  },
  logoText: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: '#0f4c35', display: 'block', lineHeight: 1.1 },
  logoSub: { fontSize: 10, color: '#9ab5a5', fontWeight: 500, display: 'block' },
  links: { display: 'flex', alignItems: 'center', gap: 4, flex: 1, '@media(max-width:768px)': { display: 'none' } },
  link: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
    color: '#3d5a4a', textDecoration: 'none', transition: 'all 0.15s',
  },
  linkActive: { background: '#f0fdf4', color: '#0f4c35', fontWeight: 600 },
  right: { display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' },
  liveIndicator: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '4px 8px', borderRadius: 100,
    background: '#f0fdf4', fontSize: 11,
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    background: '#0f4c35', color: 'white', textDecoration: 'none',
    transition: 'background 0.2s',
  },
  userMenu: { display: 'flex', alignItems: 'center', gap: 6 },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: '#0f4c35', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 14, textDecoration: 'none',
    flexShrink: 0,
  },
  logoutBtn: { background: 'none', color: '#6b8a78', padding: '6px', borderRadius: 6, display: 'flex', alignItems: 'center' },
  loginBtn: {
    padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    color: '#0f4c35', border: '1.5px solid #c8d4cc', textDecoration: 'none',
  },
  registerBtn: {
    padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    background: '#0f4c35', color: 'white', textDecoration: 'none',
  },
  menuBtn: { display: 'none', background: 'none', color: '#0f4c35', padding: 4, '@media(max-width:768px)': { display: 'flex' } },
  mobileMenu: {
    borderTop: '1px solid #e2e8e4', padding: '12px 20px 16px',
    display: 'flex', flexDirection: 'column', gap: 2,
    background: 'white',
  },
  mobileLink: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 8, fontSize: 15, fontWeight: 500,
    color: '#0d1f18', textDecoration: 'none', cursor: 'pointer',
  },
  mobileDivider: { height: 1, background: '#e2e8e4', margin: '6px 0' },
};
