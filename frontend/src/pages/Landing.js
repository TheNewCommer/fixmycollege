import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { statsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiAlertCircle, FiHeart, FiArrowRight, FiZap, FiShield, FiUsers } from 'react-icons/fi';

// ─── TYPEWRITER HOOK ──────────────────────────────────────
function useTypewriter(texts, speed = 60, pause = 1800) {
  const [display, setDisplay] = useState('');
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    let timeout;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(c => c + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(c => c - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setIdx(i => (i + 1) % texts.length);
    }
    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, idx, texts, speed, pause]);

  return display;
}

// ─── COUNTER HOOK ─────────────────────────────────────────
function useCounter(target, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (!target || ref.current) return;
    ref.current = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}

// ─── ANIMATED STAT ────────────────────────────────────────
function AnimatedStat({ value, label }) {
  const isPercent = String(value).includes('%');
  const num = parseInt(String(value).replace('%', ''));
  const count = useCounter(num);
  return (
    <div style={styles.heroStat}>
      <span style={styles.heroStatVal}>{count}{isPercent ? '%' : ''}</span>
      <span style={styles.heroStatLabel}>{label}</span>
    </div>
  );
}

export default function Landing() {
  const [stats, setStats] = useState(null);
  const { user, isAdmin } = useAuth();

  const typewriterText = useTypewriter([
    'Submit a report in 30 seconds ⚡',
    'AI classifies your issue instantly 🤖',
    'Admin gets SMS alert on their phone 📱',
    'Track resolution status in real-time 🔴',
    'Proof uploaded when issue is fixed ✅',
  ]);

  useEffect(() => {
    statsAPI.get().then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  const features = [
    { icon: '🚨', title: 'Civic Issue Reporting', desc: 'Report dustbins, tap leaks, broken lights — anything affecting campus life. Upload a photo and submit in 30 seconds.', color: '#0f4c35', bg: '#f0fdf4' },
    { icon: '💚', title: 'Personal Wellbeing', desc: 'Post anonymously about stress, academic pressure, or anything on your mind. Peers and admins respond with support.', color: '#dc2626', bg: '#fef2f2' },
    { icon: '🔒', title: 'Ragging Reporting', desc: 'Report ragging incidents completely privately. Your report goes directly to a trusted authority — invisible to others.', color: '#7c3aed', bg: '#f5f3ff' },
    { icon: '⚡', title: 'Real-Time Resolution', desc: 'Admins get SMS the moment you report. They assign, work, and upload proof when resolved. Track everything live.', color: '#d97706', bg: '#fffbeb' },
  ];

  const howItWorks = [
    { step: '01', title: 'Submit a Report', desc: 'Fill a quick form, upload a photo, and hit submit.' },
    { step: '02', title: 'Admin Gets SMS', desc: 'Admin receives an instant SMS on their phone.' },
    { step: '03', title: 'Action is Taken', desc: 'Admin assigns the issue and marks it In Progress.' },
    { step: '04', title: 'Issue Resolved', desc: 'Admin uploads proof photo. Status updates to Resolved.' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes driftLeft {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          50% { transform: translateX(-10px) translateY(-6px); }
        }
        @keyframes driftRight {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          50% { transform: translateX(8px) translateY(-10px); }
        }
        .hero-animate { animation: fadeInUp 0.7s ease forwards; }
        .hero-animate-2 { animation: fadeInUp 0.7s ease 0.15s forwards; opacity: 0; }
        .hero-animate-3 { animation: fadeInUp 0.7s ease 0.3s forwards; opacity: 0; }
        .hero-animate-4 { animation: fadeInUp 0.7s ease 0.45s forwards; opacity: 0; }
        .college-float { animation: float 4s ease-in-out infinite; }
        .feature-card { transition: transform 0.2s, box-shadow 0.2s; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(15,76,53,0.12); }
        .step-card { transition: transform 0.2s; }
        .step-card:hover { transform: translateY(-3px); }
        .doodle-drift-l { animation: driftLeft 6s ease-in-out infinite; }
        .doodle-drift-r { animation: driftRight 7s ease-in-out infinite; }
        .doodle-float { animation: floatSlow 5s ease-in-out infinite; }
      `}</style>

      {/* ─── HERO ─── */}
      <section style={styles.hero}>

        {/* ─── DOT GRID BACKGROUND ─── */}
        <svg style={styles.dotGrid} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.07)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* ─── DOODLE ICONS — left side ─── */}
        <div style={{ ...styles.doodleLeft }} className="doodle-drift-l">
          {/* Clipboard doodle */}
          <svg width="64" height="80" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.12">
            <rect x="6" y="12" width="52" height="62" rx="4" stroke="white" strokeWidth="2.5" strokeDasharray="5 3"/>
            <rect x="20" y="4" width="24" height="14" rx="3" stroke="white" strokeWidth="2.5"/>
            <line x1="16" y1="34" x2="48" y2="34" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="46" x2="48" y2="46" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="58" x2="36" y2="58" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <polyline points="16,34 20,38 28,30" stroke="#f4a621" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
          </svg>
        </div>

        {/* ─── DOODLE ICONS — right side ─── */}
        <div style={{ ...styles.doodleRight }} className="doodle-drift-r">
          {/* Phone notification doodle */}
          <svg width="52" height="80" viewBox="0 0 52 80" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.12">
            <rect x="6" y="4" width="40" height="68" rx="8" stroke="white" strokeWidth="2.5" strokeDasharray="5 3"/>
            <line x1="20" y1="16" x2="32" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="12" y="26" width="28" height="24" rx="4" stroke="white" strokeWidth="2"/>
            <line x1="18" y1="33" x2="34" y2="33" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="18" y1="39" x2="28" y2="39" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="26" cy="62" r="4" stroke="white" strokeWidth="2"/>
            <circle cx="38" cy="8" r="6" fill="#f4a621" opacity="0.6"/>
            <text x="36" y="11" fill="white" fontSize="7" fontWeight="bold">!</text>
          </svg>
        </div>

        {/* ─── SMALL FLOATING SHAPES ─── */}
        <div style={styles.floatShape1} className="doodle-float">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.1">
            <polygon points="20,4 36,36 4,36" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none"/>
          </svg>
        </div>
        <div style={styles.floatShape2} className="doodle-float">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity="0.1">
            <rect x="4" y="4" width="24" height="24" rx="4" stroke="white" strokeWidth="2" strokeDasharray="4 2" transform="rotate(15 16 16)" fill="none"/>
          </svg>
        </div>
        <div style={styles.floatShape3} className="doodle-float">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" opacity="0.1">
            <circle cx="14" cy="14" r="10" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none"/>
          </svg>
        </div>

        {/* ─── DIAGONAL LINES — top right corner ─── */}
        <svg style={styles.cornerLines} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.06">
          {[0,20,40,60,80,100,120,140,160,180].map(i => (
            <line key={i} x1={i} y1="0" x2="200" y2={200-i} stroke="white" strokeWidth="1"/>
          ))}
        </svg>
        <div style={styles.heroInner}>
          <div className="hero-animate" style={styles.heroBadge}>
            <span style={{ background: '#f4a621', width: 8, height: 8, borderRadius: '50%', display: 'inline-block', marginRight: 8, animation: 'pulse-dot 1.2s infinite' }} />
            Now live at Sershah Engineering College
          </div>

          <h1 className="hero-animate-2" style={styles.heroTitle}>
            Fix Your College,<br />
            <span style={{ color: '#f4a621' }}>One Report at a Time</span>
          </h1>

          {/* ─── TYPEWRITER ─── */}
          <div className="hero-animate-3" style={styles.typewriterBox}>
            <span style={styles.typewriterText}>{typewriterText}</span>
            <span style={{ color: '#f4a621', fontWeight: 700, animation: 'pulse-dot 0.8s infinite' }}>|</span>
          </div>

          <div className="hero-animate-4" style={styles.heroBtns}>
            {isAdmin ? (
              <>
                <Link to="/admin" className="btn btn-accent btn-lg"><FiShield /> Go to Dashboard</Link>
                <Link to="/reports" className="btn btn-outline btn-lg" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                  View Reports <FiArrowRight />
                </Link>
              </>
            ) : (
              <>
                <Link to="/submit" className="btn btn-accent btn-lg"><FiAlertCircle /> Report an Issue</Link>
                <Link to="/reports" className="btn btn-outline btn-lg" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                  View Reports <FiArrowRight />
                </Link>
              </>
            )}
          </div>

          {/* ─── ANIMATED STATS ─── */}
          {stats && (
            <div style={styles.heroStats}>
              <AnimatedStat value={stats.totalReports} label="Total Reports" />
              <AnimatedStat value={stats.resolvedReports} label="Resolved" />
              <AnimatedStat value={`${stats.resolutionRate}%`} label="Resolution Rate" />
              <AnimatedStat value={stats.totalUsers} label="Students" />
            </div>
          )}
        </div>

        {/* ─── FLOATING COLLEGE IMAGE ─── */}
        <div style={styles.collegeImgWrap}>
          <div className="college-float">
            <img
              src="https://res.cloudinary.com/dv7lsnh20/image/upload/v1778560498/IMG_2443_wrzsf5.jpg"
              alt="Sershah Engineering College"
              style={styles.collegeImg}
            />
            <div style={styles.collegeImgLabel}>Sershah Engineering College, Bihar</div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section style={styles.section}>
        <div className="container">
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Everything You Need</h2>
            <p style={styles.sectionDesc}>One platform for all campus problems — civic and personal.</p>
          </div>
          <div className="grid-2" style={{ gap: 20 }}>
            {features.map(f => (
              <div key={f.title} className="card feature-card" style={{ borderTop: `3px solid ${f.color}` }}>
                <div style={{ width: 48, height: 48, background: f.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#6b8a78', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ ...styles.section, background: '#f8faf9' }}>
        <div className="container">
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>How It Works</h2>
            <p style={styles.sectionDesc}>Real resolution, not just a dashboard. Here is the full cycle.</p>
          </div>
          <div className="grid-4" style={{ gap: 20 }}>
            {howItWorks.map((s, i) => (
              <div key={s.step} className="step-card" style={styles.stepCard}>
                <div style={styles.stepNum}>{s.step}</div>
                <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.title}</h4>
                <p style={{ fontSize: 13, color: '#6b8a78', lineHeight: 1.6 }}>{s.desc}</p>
                {i < howItWorks.length - 1 && <div style={styles.stepArrow}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={styles.cta}>
        <div className="container" style={{ textAlign: 'center' }}>
          <FiUsers size={40} style={{ color: '#f4a621', marginBottom: 16 }} />
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, color: 'white', marginBottom: 12 }}>
            Be the Change on Campus
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, marginBottom: 28, maxWidth: 500, margin: '0 auto 28px' }}>
            Every report you submit makes Sershah Engineering College a better place. Your voice matters.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-accent btn-lg">Get Started Free</Link>
            <Link to="/wellbeing" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)' }}>
              <FiHeart /> Wellbeing Wall
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  hero: { background: 'linear-gradient(135deg, #0f4c35 0%, #083222 60%, #0a3d2a 100%)', padding: '80px 20px 0', position: 'relative', overflow: 'hidden' },
  dotGrid: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 },
  doodleLeft: { position: 'absolute', left: '4%', top: '15%', zIndex: 0, pointerEvents: 'none' },
  doodleRight: { position: 'absolute', right: '4%', top: '20%', zIndex: 0, pointerEvents: 'none' },
  floatShape1: { position: 'absolute', left: '12%', bottom: '30%', zIndex: 0, pointerEvents: 'none' },
  floatShape2: { position: 'absolute', right: '14%', bottom: '25%', zIndex: 0, pointerEvents: 'none' },
  floatShape3: { position: 'absolute', left: '20%', top: '10%', zIndex: 0, pointerEvents: 'none' },
  cornerLines: { position: 'absolute', top: 0, right: 0, width: 200, height: 200, pointerEvents: 'none', zIndex: 0 },
  heroInner: { maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1, paddingBottom: 48 },
  heroBadge: { display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600, padding: '6px 16px', borderRadius: 100, marginBottom: 24, border: '1px solid rgba(255,255,255,0.2)' },
  heroTitle: { fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 24 },
  typewriterBox: { minHeight: 36, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 },
  typewriterText: { fontSize: 18, color: 'rgba(255,255,255,0.85)', fontWeight: 500 },
  heroBtns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 },
  heroStats: { display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', padding: '24px 0 0', borderTop: '1px solid rgba(255,255,255,0.12)' },
  heroStat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  heroStatVal: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#f4a621' },
  heroStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  collegeImgWrap: { maxWidth: 900, margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 },
  collegeImg: { width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: '16px 16px 0 0', display: 'block', boxShadow: '0 -8px 32px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.15)' },
  collegeImgLabel: { background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, textAlign: 'center', padding: '6px 0', borderRadius: '0 0 8px 8px', letterSpacing: 0.5 },
  section: { padding: '72px 20px' },
  sectionHead: { textAlign: 'center', marginBottom: 40 },
  sectionTitle: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#0d1f18', marginBottom: 8 },
  sectionDesc: { fontSize: 15, color: '#6b8a78' },
  stepCard: { background: 'white', border: '1px solid #e2e8e4', borderRadius: 14, padding: 24, position: 'relative' },
  stepNum: { fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color: '#f0fdf4', WebkitTextStroke: '2px #0f4c35', marginBottom: 12, lineHeight: 1 },
  stepArrow: { position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: '#c8d4cc', fontWeight: 700, zIndex: 2 },
  cta: { background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)', padding: '72px 20px' },
};
