import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiAlertCircle, FiHeart, FiBarChart2,
  FiPlusCircle, FiUser, FiLogOut, FiMenu, FiX,
  FiShield, FiList, FiWifi, FiWifiOff, FiBell
} from 'react-icons/fi';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const isStudent = user && !isAdmin;
  const { connected, on, off } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const notifRef = useRef();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isStudent) return;
    notificationsAPI.getAll()
      .then(({ data }) => { setUnreadCount(data.unreadCount); setNotifications(data.notifications); })
      .catch(() => {});
  }, [isStudent, user]);

  useEffect(() => {
    if (!isStudent || !user) return;
    const handleNotif = () => {
      setUnreadCount(prev => prev + 1);
      notificationsAPI.getAll().then(({ data }) => setNotifications(data.notifications)).catch(() => {});
    };
    on(`notification_${user._id}`, handleNotif);
    return () => off(`notification_${user._id}`, handleNotif);
  }, [isStudent, user, on, off]);

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>

        {/* ─── LOGO ─── */}
        <Link to="/" style={styles.logo} onClick={() => setMenuOpen(false)}>
          <div style={styles.logoIcon}>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiotCjRVLORF0KZLLLY6KURC2tRpRns6A9NA&s"
              alt="Sershah Engineering College"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
            />
          </div>
          <div>
            <span style={styles.logoText}>
              <span style={{ color: '#0f4c35' }}>Fix</span>
              <span style={{ color: '#0f4c35' }}>My</span>
              <span style={{ color: '#f4a621', textShadow: '0 2px 8px rgba(244,166,33,0.35)' }}>College</span>
            </span>
            <span style={styles.logoSub}>Sershah Engineering College</span>
          </div>
        </Link>

        {/* ─── DESKTOP NAV LINKS ─── */}
        <div style={styles.links}>
          <Link to="/reports" style={{ ...styles.link, ...(isActive('/reports') ? styles.linkActive : {}) }}>
            <FiAlertCircle size={15} /> Civic Issues
          </Link>
          <Link to="/wellbeing" style={{ ...styles.link, ...(isActive('/wellbeing') ? styles.linkActive : {}) }}>
            <FiHeart size={15} /> Wellbeing
          </Link>
          <Link to="/analytics" style={{ ...styles.link, ...(isActive('/analytics') ? styles.linkActive : {}) }}>
            <FiBarChart2 size={15} /> Analytics
          </Link>
          {isAdmin && (
            <Link to="/admin" style={{ ...styles.link, ...(isActive('/admin') ? styles.linkActiveAdmin : {}), color: '#f4a621', fontWeight: 700 }}>
              <FiShield size={15} /> Admin
            </Link>
          )}
        </div>

        {/* ─── RIGHT SIDE ─── */}
        <div style={styles.right}>

          {/* Live indicator — hide on mobile */}
          {!isMobile && (
            <div style={{ ...styles.liveIndicator, borderColor: connected ? '#bbf7d0' : '#e5e7eb', color: connected ? '#16a34a' : '#9ca3af' }}>
              {connected ? <FiWifi size={12} /> : <FiWifiOff size={12} />}
              <span>{connected ? 'LIVE' : '...'}</span>
            </div>
          )}

          {user ? (
            <>
              {/* Report Issue — student only, desktop only */}
              {isStudent && !isMobile && (
                <Link to="/submit" style={styles.submitBtn}>
                  <FiPlusCircle size={14} /> Report Issue
                </Link>
              )}

              {/* Notification Bell — students only */}
              {isStudent && (
                <div style={{ position: 'relative' }} ref={notifRef}>
                  <button onClick={() => setNotifOpen(o => !o)} style={styles.iconBtn} title="Notifications">
                    <FiBell size={17} />
                    {unreadCount > 0 && <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>

                  {notifOpen && (
                    <div style={{ ...styles.notifDropdown, right: isMobile ? -60 : 0 }}>
                      <div style={styles.notifHeader}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#0d1f18' }}>Notifications</span>
                        {unreadCount > 0 && <button onClick={handleMarkAllRead} style={styles.markReadBtn}>Mark all read</button>}
                      </div>
                      {notifications.length === 0 ? (
                        <div style={styles.notifEmpty}>🔔 No notifications yet</div>
                      ) : (
                        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                          {notifications.map(n => (
                            <div key={n._id}
                              style={{ ...styles.notifItem, background: n.isRead ? 'white' : '#f0fdf4' }}
                              onClick={async () => {
                                if (!n.isRead) {
                                  await notificationsAPI.markOneRead(n._id);
                                  setUnreadCount(prev => Math.max(0, prev - 1));
                                  setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x));
                                }
                                setNotifOpen(false);
                                if (n.reportId) navigate(`/reports/${n.reportId}`);
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: '#0d1f18', lineHeight: 1.4 }}>{n.title}</span>
                                {!n.isRead && <span style={styles.unreadDot} />}
                              </div>
                              <p style={{ fontSize: 12, color: '#6b8a78', margin: '3px 0 0', lineHeight: 1.4 }}>{n.message}</p>
                              <span style={{ fontSize: 11, color: '#9ab5a5', marginTop: 4, display: 'block' }}>
                                {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* My Reports — desktop only */}
              {isStudent && !isMobile && (
                <Link to="/my-reports" style={{ ...styles.iconBtn, textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#3d5a4a', padding: '7px 12px', gap: 5, minWidth: 'auto' }} title="My Reports">
                  <FiList size={15} /> My Reports
                </Link>
              )}

              {/* Avatar */}
              <Link to="/profile" style={styles.avatar} title={user?.name}>
                {user?.name?.charAt(0).toUpperCase()}
              </Link>

              {/* Logout — desktop only */}
              {!isMobile && (
                <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
                  <FiLogOut size={16} />
                </button>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {!isMobile && <Link to="/login" style={styles.loginBtn}>Login</Link>}
              <Link to="/register" style={styles.registerBtn}>{isMobile ? 'Join' : 'Register'}</Link>
            </div>
          )}

          {/* Hamburger — always visible on mobile */}
          <button style={{ ...styles.menuBtn, display: isMobile ? 'flex' : 'none' }} onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* ─── MOBILE MENU ─── */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          <Link to="/reports" style={styles.mobileLink} onClick={() => setMenuOpen(false)}><FiAlertCircle /> Civic Issues</Link>
          <Link to="/wellbeing" style={styles.mobileLink} onClick={() => setMenuOpen(false)}><FiHeart /> Wellbeing</Link>
          <Link to="/analytics" style={styles.mobileLink} onClick={() => setMenuOpen(false)}><FiBarChart2 /> Analytics</Link>
          {isAdmin && <Link to="/admin" style={{ ...styles.mobileLink, color: '#f4a621' }} onClick={() => setMenuOpen(false)}><FiShield /> Admin Dashboard</Link>}
          <div style={styles.mobileDivider} />
          {user ? (
            <>
              {isStudent && <Link to="/submit" style={styles.mobileLink} onClick={() => setMenuOpen(false)}><FiPlusCircle /> Report an Issue</Link>}
              {isStudent && <Link to="/my-reports" style={styles.mobileLink} onClick={() => setMenuOpen(false)}><FiList /> My Reports</Link>}
              <Link to="/profile" style={styles.mobileLink} onClick={() => setMenuOpen(false)}><FiUser /> Profile</Link>
              <button style={{ ...styles.mobileLink, background: 'none', border: 'none', width: '100%', textAlign: 'left', color: '#dc2626', cursor: 'pointer' }} onClick={handleLogout}><FiLogOut /> Logout</button>
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
    background: 'rgba(255,255,255,0.98)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1.5px solid #e8f0ec',
    boxShadow: '0 2px 16px rgba(15,76,53,0.06)',
  },
  inner: {
    maxWidth: 1280, margin: '0 auto', padding: '0 28px',
    height: 68, display: 'flex', alignItems: 'center', gap: 8,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0, marginRight: 16 },
  logoIcon: {
    width: 40, height: 40, borderRadius: 10,
    overflow: 'hidden', flexShrink: 0,
    boxShadow: '0 2px 8px rgba(15,76,53,0.25)',
    border: '2px solid #e8f0ec',
  },
  logoText: {
    fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18,
    display: 'block', lineHeight: 1.15, letterSpacing: '-0.3px',
    textShadow: '0 1px 2px rgba(15,76,53,0.08)',
  },
  logoSub: { fontSize: 10, color: '#9ab5a5', fontWeight: 500, display: 'block' },
  links: { display: 'flex', alignItems: 'center', gap: 2, flex: 1 },
  link: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 500,
    color: '#4a6a58', textDecoration: 'none', transition: 'all 0.15s',
    letterSpacing: 0.1, whiteSpace: 'nowrap',
  },
  linkActive: {
    background: '#0f4c35', color: 'white', fontWeight: 600,
    boxShadow: '0 2px 8px rgba(15,76,53,0.2)',
  },
  linkActiveAdmin: { background: '#fef3c7', color: '#b45309', fontWeight: 700 },
  right: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 },
  liveIndicator: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 10px', borderRadius: 100,
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
    background: 'linear-gradient(135deg,#0f4c35,#1a6b4a)', color: 'white',
    textDecoration: 'none', boxShadow: '0 2px 8px rgba(15,76,53,0.25)',
    whiteSpace: 'nowrap', minHeight: 44,
  },
  iconBtn: {
    position: 'relative', background: 'none',
    border: '1.5px solid #e2e8e4', color: '#0f4c35',
    padding: '7px 9px', borderRadius: 10, minHeight: 44, minWidth: 44,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  badge: {
    position: 'absolute', top: -7, right: -7,
    background: '#dc2626', color: 'white',
    fontSize: 10, fontWeight: 800,
    width: 19, height: 19, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2.5px solid white',
  },
  avatar: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'linear-gradient(135deg,#0f4c35,#1a6b4a)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 15, textDecoration: 'none', flexShrink: 0,
    boxShadow: '0 2px 8px rgba(15,76,53,0.2)', border: '2px solid #e8f0ec',
    minHeight: 38, minWidth: 38,
  },
  logoutBtn: {
    background: 'none', border: '1.5px solid #e2e8e4',
    color: '#9ab5a5', padding: '7px 9px', borderRadius: 10,
    display: 'flex', alignItems: 'center', cursor: 'pointer',
    minHeight: 44, minWidth: 44, justifyContent: 'center',
  },
  loginBtn: {
    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    color: '#0f4c35', border: '1.5px solid #c8d4cc', textDecoration: 'none',
    minHeight: 44, display: 'flex', alignItems: 'center',
  },
  registerBtn: {
    padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
    background: 'linear-gradient(135deg,#0f4c35,#1a6b4a)', color: 'white',
    textDecoration: 'none', boxShadow: '0 2px 8px rgba(15,76,53,0.2)',
    minHeight: 44, display: 'flex', alignItems: 'center',
  },
  menuBtn: {
    background: 'none', border: 'none',
    color: '#0f4c35', padding: 6, cursor: 'pointer', borderRadius: 8,
    minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  notifDropdown: {
    position: 'absolute', right: 0, top: 48,
    width: 330, background: 'white',
    border: '1px solid #e2e8e4', borderRadius: 16,
    boxShadow: '0 8px 40px rgba(15,76,53,0.15)', zIndex: 300,
  },
  notifHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px 10px', borderBottom: '1px solid #f0fdf4',
  },
  markReadBtn: { background: 'none', border: 'none', color: '#0f4c35', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  notifEmpty: { padding: '28px 16px', textAlign: 'center', fontSize: 13, color: '#9ab5a5' },
  notifItem: { padding: '12px 18px', borderBottom: '1px solid #f0f4f2', cursor: 'pointer' },
  unreadDot: { width: 8, height: 8, borderRadius: '50%', background: '#0f4c35', flexShrink: 0, marginTop: 3 },
  mobileMenu: { borderTop: '1px solid #e2e8e4', padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 2, background: 'white' },
  mobileLink: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: 15, fontWeight: 500, color: '#0d1f18', textDecoration: 'none', cursor: 'pointer' },
  mobileDivider: { height: 1, background: '#e2e8e4', margin: '6px 0' },
};
