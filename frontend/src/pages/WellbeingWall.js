import React, { useState, useEffect, useCallback } from 'react';
import { wellbeingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { FiHeart, FiMessageCircle, FiSend, FiShield, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { aiAPI } from '../services/api';

const CATEGORIES = [
  { value: 'peer_support', label: '💬 Peer Support', desc: 'Share anything on your mind. The community listens.', color: '#2563eb', bg: '#eff6ff' },
  { value: 'academic_pressure', label: '📚 Academic Pressure', desc: 'Struggling with studies, exams, or deadlines?', color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'mental_health', label: '🧠 Mental Health', desc: 'Feeling overwhelmed, anxious, or low?', color: '#0891b2', bg: '#ecfeff' },
  { value: 'personal', label: '🌱 Personal', desc: 'Anything personal you want to share anonymously.', color: '#059669', bg: '#f0fdf4' },
  { value: 'ragging', label: '🚨 Ragging Report', desc: 'Report privately. Only one trusted admin sees this.', color: '#dc2626', bg: '#fef2f2', isPrivate: true },
];

const FEELINGS = [
  { value: 'anxious', emoji: '😰' }, { value: 'stressed', emoji: '😤' },
  { value: 'sad', emoji: '😢' }, { value: 'angry', emoji: '😡' },
  { value: 'overwhelmed', emoji: '😵' }, { value: 'hopeful', emoji: '🌟' },
  { value: 'confused', emoji: '😕' },
];

export default function WellbeingWall() {
  const { user } = useAuth();
  const { on, off } = useSocket();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'peer_support', content: '', feeling: '' });
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sentimentResult, setSentimentResult] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterCat ? { category: filterCat } : {};
      const { data } = await wellbeingAPI.getAll(params);
      setPosts(data.posts);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }, [filterCat]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const handler = () => fetchPosts();
    on('new_wellbeing_post', handler);
    return () => off('new_wellbeing_post', handler);
  }, [on, off, fetchPosts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) { toast.error('Please write something'); return; }
    setSubmitting(true);
    try {
      // ─── FEATURE 2: SENTIMENT ANALYSIS ───────────────────
      let sentiment = null;
      if (form.category !== 'ragging') {
        try {
          const { data: sentData } = await aiAPI.sentiment(form.content, form.category);
          if (sentData.success) {
            sentiment = sentData.analysis;
            setSentimentResult(sentData.analysis);
          }
        } catch (err) {
          console.error('Sentiment error:', err);
        }
      }
      const { data } = await wellbeingAPI.create(form);
      toast.success(data.message);
      // Show AI support message if sentiment detected
      if (sentiment?.supportMessage && form.category !== 'ragging') {
        setTimeout(() => toast(sentiment.supportMessage, { icon: '💚', duration: 5000 }), 500);
      }
      setShowForm(false);
      setForm({ category: 'peer_support', content: '', feeling: '' });
      setSentimentResult(null);
      if (form.category !== 'ragging') fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally { setSubmitting(false); }
  };

  const handleSupport = async (id) => {
    if (!user) { toast.error('Please login to show support'); return; }
    try {
      const { data } = await wellbeingAPI.support(id);
      setPosts(prev => prev.map(p => p._id === id ? { ...p, supportCount: data.supportCount } : p));
    } catch { toast.error('Failed'); }
  };

  const handleReply = async (postId) => {
    if (!user) { toast.error('Please login to reply'); return; }
    if (!replyText.trim()) return;
    try {
      const { data } = await wellbeingAPI.addReply(postId, replyText.trim());
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, replies: data.replies } : p));
      setReplyingTo(null);
      setReplyText('');
      toast.success('Reply added!');
    } catch { toast.error('Failed to reply'); }
  };

  const selectedCat = CATEGORIES.find(c => c.value === form.category);

  return (
    <div className="page">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Wellbeing Wall</h1>
          <p style={styles.subtitle}>A safe, anonymous space to share, support, and be heard.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancel' : '+ Share Something'}
        </button>
      </div>

      {/* ─── POST FORM ─── */}
      {showForm && (
        <div className="card slide-up" style={{ padding: 28, marginBottom: 24, borderTop: '3px solid #0f4c35' }}>
          <h3 style={styles.formTitle}>Share Anonymously</h3>
          <form onSubmit={handleSubmit}>
            {/* Category selection */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  style={{ ...styles.catBtn, background: form.category === cat.value ? cat.color : cat.bg, color: form.category === cat.value ? 'white' : cat.color, borderColor: cat.color }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Ragging warning */}
            {form.category === 'ragging' && (
              <div style={styles.raggingWarn}>
                <FiShield size={16} />
                <div>
                  <strong>Completely Private & Confidential</strong>
                  <p style={{ fontSize: 12, marginTop: 2 }}>This report will ONLY be visible to one trusted admin. It will not appear on this wall. You are safe.</p>
                </div>
              </div>
            )}

            {/* Feeling selector */}
            {form.category !== 'ragging' && (
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">How are you feeling? (optional)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {FEELINGS.map(f => (
                    <button key={f.value} type="button"
                      onClick={() => setForm(ff => ({ ...ff, feeling: ff.feeling === f.value ? '' : f.value }))}
                      style={{ ...styles.feelingBtn, background: form.feeling === f.value ? '#0f4c35' : '#f8faf9', color: form.feeling === f.value ? 'white' : '#3d5a4a', borderColor: form.feeling === f.value ? '#0f4c35' : '#e2e8e4' }}>
                      {f.emoji} {f.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea className="form-input" rows={4}
              placeholder={form.category === 'ragging' ? 'Describe what happened. Include date, location, and names if you know them. This is completely private.' : "Write whatever is on your mind. You are anonymous here. No judgment."}
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              maxLength={1000} />
            <div style={{ fontSize: 11, color: '#9ab5a5', textAlign: 'right', marginBottom: 12 }}>{form.content.length}/1000</div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !form.content.trim()}>
                {submitting ? '...' : form.category === 'ragging' ? <><FiShield size={14} /> Submit Privately</> : <><FiSend size={14} /> Post Anonymously</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── CATEGORY FILTER ─── */}
      <div style={styles.filterRow}>
        <button className={`btn btn-sm ${!filterCat ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterCat('')}>All</button>
        {CATEGORIES.filter(c => c.value !== 'ragging').map(c => (
          <button key={c.value} className={`btn btn-sm ${filterCat === c.value ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterCat(c.value)}>{c.label}</button>
        ))}
      </div>

      {/* ─── RAGGING QUICK LINK ─── */}
      <div style={styles.raggingQuick} onClick={() => { setShowForm(true); setForm(f => ({ ...f, category: 'ragging' })); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
        <FiAlertTriangle size={16} style={{ color: '#dc2626' }} />
        <div>
          <strong style={{ fontSize: 14, color: '#dc2626' }}>Experiencing Ragging?</strong>
          <p style={{ fontSize: 12, color: '#6b8a78', marginTop: 2 }}>Click here to report it privately and confidentially. Only one trusted admin will see it.</p>
        </div>
        <span style={{ fontSize: 20 }}>→</span>
      </div>

      {/* ─── POSTS ─── */}
      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <div className="empty-state"><div style={{ fontSize: 48, marginBottom: 12 }}>💬</div><h3>No posts yet</h3><p>Be the first to share something on the wellbeing wall.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          {posts.map(post => {
            const cat = CATEGORIES.find(c => c.value === post.category);
            const feeling = FEELINGS.find(f => f.value === post.feeling);
            return (
              <div key={post._id} className="card fade-in" style={{ padding: 20, borderLeft: `4px solid ${cat?.color || '#0f4c35'}` }}>
                <div style={styles.postTop}>
                  <span style={{ ...styles.catTag, background: cat?.bg, color: cat?.color }}>{cat?.label}</span>
                  {feeling && <span style={styles.feelingTag}>{feeling.emoji} {post.feeling}</span>}
                  <span style={styles.timeTag}>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                </div>
                <p style={styles.postContent}>{post.content}</p>
                <div style={styles.postActions}>
                  <button onClick={() => handleSupport(post._id)} style={styles.supportBtn}>
                    <FiHeart size={14} fill={user && post.supportedBy?.includes(user._id) ? '#dc2626' : 'none'} style={{ color: '#dc2626' }} />
                    {post.supportCount || 0} supporting
                  </button>
                  <button onClick={() => setReplyingTo(replyingTo === post._id ? null : post._id)} style={styles.replyBtn}>
                    <FiMessageCircle size={14} /> {post.replies?.length || 0} replies
                  </button>
                </div>

                {/* Replies */}
                {post.replies?.length > 0 && (
                  <div style={styles.repliesWrap}>
                    {post.replies.map((r, i) => (
                      <div key={i} style={styles.replyItem}>
                        <div style={{ ...styles.replyAvatar, background: r.isAdminReply ? '#0f4c35' : '#f0fdf4', color: r.isAdminReply ? 'white' : '#0f4c35' }}>
                          {r.isAdminReply ? '👮' : '💬'}
                        </div>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: r.isAdminReply ? '#0f4c35' : '#3d5a4a' }}>{r.authorName}</span>
                          <p style={{ fontSize: 13, color: '#3d5a4a', marginTop: 2 }}>{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply form */}
                {replyingTo === post._id && (
                  <div style={styles.replyForm}>
                    {user ? (
                      <>
                        <input className="form-input" style={{ fontSize: 13, padding: '8px 12px' }} placeholder="Write a supportive reply..." value={replyText} onChange={e => setReplyText(e.target.value)} maxLength={500} />
                        <button className="btn btn-primary btn-sm" onClick={() => handleReply(post._id)} disabled={!replyText.trim()}>
                          <FiSend size={13} /> Reply
                        </button>
                      </>
                    ) : (
                      <p style={{ fontSize: 13, color: '#9ab5a5' }}>Please <a href="/login" style={{ color: '#0f4c35' }}>login</a> to reply.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#0d1f18', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9ab5a5' },
  formTitle: { fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#0d1f18', marginBottom: 16 },
  catBtn: { padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s' },
  feelingBtn: { padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 500, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s' },
  raggingWarn: { display: 'flex', gap: 10, alignItems: 'flex-start', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14 },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  raggingQuick: { display: 'flex', gap: 12, alignItems: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '14px 18px', cursor: 'pointer', marginBottom: 20 },
  postTop: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  catTag: { padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 600 },
  feelingTag: { fontSize: 12, color: '#6b8a78', background: '#f8faf9', padding: '3px 8px', borderRadius: 100 },
  timeTag: { fontSize: 11, color: '#9ab5a5', marginLeft: 'auto' },
  postContent: { fontSize: 14, color: '#0d1f18', lineHeight: 1.7, marginBottom: 14 },
  postActions: { display: 'flex', gap: 12 },
  supportBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', fontSize: 13, color: '#6b8a78', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 },
  replyBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', fontSize: 13, color: '#6b8a78', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 },
  repliesWrap: { marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f2', display: 'flex', flexDirection: 'column', gap: 10 },
  replyItem: { display: 'flex', gap: 10 },
  replyAvatar: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 },
  replyForm: { marginTop: 10, display: 'flex', gap: 8 },
};
