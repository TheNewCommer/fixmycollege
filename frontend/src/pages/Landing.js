import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statsAPI } from '../services/api';
import { FiAlertCircle, FiHeart, FiBarChart2, FiArrowRight, FiCheckCircle, FiZap, FiShield, FiUsers } from 'react-icons/fi';

export default function Landing() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    statsAPI.get().then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  const features = [
    { icon: <FiAlertCircle size={24} />, title: 'Civic Issue Reporting', desc: 'Report potholes, overflowing dustbins, tap leaks, broken lights — anything affecting your campus life. Upload a photo and submit.', color: '#0f4c35', bg: '#f0fdf4' },
    { icon: <FiHeart size={24} />, title: 'Personal Wellbeing', desc: 'Post anonymously about stress, academic pressure, bad mess food, or anything on your mind. Peers and admins respond with support.', color: '#dc2626', bg: '#fef2f2' },
    { icon: <FiShield size={24} />, title: 'Ragging Reporting', desc: 'Report ragging incidents completely privately and anonymously. Your report goes directly to a trusted authority — not visible to anyone else.', color: '#7c3aed', bg: '#f5f3ff' },
    { icon: <FiZap size={24} />, title: 'Real-Time Resolution', desc: 'Admins receive an SMS the moment you report. They assign it, work on it, and upload proof when resolved. You can track everything live.', color: '#d97706', bg: '#fffbeb' },
  ];

  const howItWorks = [
    { step: '01', title: 'Submit a Report', desc: 'Fill a quick form, upload a photo if you have one, and hit submit. Takes 30 seconds.' },
    { step: '02', title: 'Admin Gets SMS', desc: 'The responsible admin receives an instant SMS on their phone with your report details.' },
    { step: '03', title: 'Action is Taken', desc: 'Admin assigns the issue to the right worker and marks it In Progress.' },
    { step: '04', title: 'Issue Resolved', desc: 'Admin uploads a proof photo when done. Status updates to Resolved. You can verify it.' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ─── HERO ─── */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroBadge}>
            <span style={{ background: '#f4a621', width: 8, height: 8, borderRadius: '50%', display: 'inline-block', marginRight: 8 }} />
            Now live at Sershah Engineering College
          </div>
          <h1 style={styles.heroTitle}>
            Fix Your College,<br />
            <span style={{ color: '#f4a621' }}>One Report at a Time</span>
          </h1>
          <p style={styles.heroDesc}>
            FixMyCollege is a real-time platform where students report civic issues and wellbeing concerns.
            Admins get instant SMS alerts and resolve issues with proof. No more ignored complaints.
          </p>
          <div style={styles.heroBtns}>
            <Link to="/submit" className="btn btn-accent btn-lg">
              <FiAlertCircle /> Report an Issue
            </Link>
            <Link to="/reports" className="btn btn-outline btn-lg" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
              View Reports <FiArrowRight />
            </Link>
          </div>

          {/* ─── LIVE STATS ─── */}
          {stats && (
            <div style={styles.heroStats}>
              {[
                { label: 'Total Reports', value: stats.totalReports },
                { label: 'Resolved', value: stats.resolvedReports },
                { label: 'Resolution Rate', value: `${stats.resolutionRate}%` },
                { label: 'Students', value: stats.totalUsers },
              ].map(s => (
                <div key={s.label} style={styles.heroStat}>
                  <span style={styles.heroStatVal}>{s.value}</span>
                  <span style={styles.heroStatLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          )}
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
              <div key={f.title} className="card" style={{ borderTop: `3px solid ${f.color}` }}>
                <div style={{ width: 48, height: 48, background: f.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: 14 }}>
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
              <div key={s.step} style={styles.stepCard}>
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
  hero: { background: 'linear-gradient(135deg, #0f4c35 0%, #083222 60%, #0a3d2a 100%)', padding: '80px 20px 70px', position: 'relative', overflow: 'hidden' },
  heroInner: { maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 },
  heroBadge: { display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600, padding: '6px 16px', borderRadius: 100, marginBottom: 24, border: '1px solid rgba(255,255,255,0.2)' },
  heroTitle: { fontFamily: 'Syne, sans-serif', fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 800, color: 'white', lineHeight: 1.15, marginBottom: 20 },
  heroDesc: { fontSize: 16, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, marginBottom: 32, maxWidth: 560, margin: '0 auto 32px' },
  heroBtns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 },
  heroStats: { display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', padding: '24px 0 0', borderTop: '1px solid rgba(255,255,255,0.12)' },
  heroStat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  heroStatVal: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#f4a621' },
  heroStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  section: { padding: '72px 20px' },
  sectionHead: { textAlign: 'center', marginBottom: 40 },
  sectionTitle: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#0d1f18', marginBottom: 8 },
  sectionDesc: { fontSize: 15, color: '#6b8a78' },
  stepCard: { background: 'white', border: '1px solid #e2e8e4', borderRadius: 14, padding: 24, position: 'relative' },
  stepNum: { fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color: '#f0fdf4', WebkitTextStroke: '2px #0f4c35', marginBottom: 12, lineHeight: 1 },
  stepArrow: { position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: '#c8d4cc', fontWeight: 700, zIndex: 2 },
  cta: { background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)', padding: '72px 20px' },
};
