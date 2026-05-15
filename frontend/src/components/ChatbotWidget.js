import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI, reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiX, FiSend, FiMessageCircle, FiZap, FiLoader, FiCheckCircle } from 'react-icons/fi';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "👋 Hi! I'm **FixBot**, your AI report assistant.\n\nJust tell me what problem you're facing on campus — I'll handle the rest! 🚀",
};

export default function ChatbotWidget() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportReady, setReportReady] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // All hooks must be called before any early return
  useEffect(() => { if (open) { scrollToBottom(); inputRef.current?.focus(); } }, [open, messages]);

  // Don't show for admins or when not logged in
  if (!user || isAdmin) return null;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Send only last 10 messages to keep context window small
      const contextMessages = newMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await aiAPI.chat(contextMessages);

      const assistantMsg = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMsg]);

      if (data.reportReady && data.reportData) {
        setReportReady(data.reportData);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again or use the regular report form.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportReady) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', reportReady.title);
      fd.append('description', reportReady.description);
      fd.append('category', reportReady.category);
      fd.append('urgency', reportReady.urgency);
      fd.append('location', reportReady.location);
      fd.append('building', reportReady.building || 'other');
      fd.append('isAnonymous', 'true');

      const { data } = await reportsAPI.create(fd);
      toast.success('Report submitted! Admin notified via SMS 📱');
      setOpen(false);
      setMessages([INITIAL_MESSAGE]);
      setReportReady(null);
      navigate(`/reports/${data.report._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_MESSAGE]);
    setReportReady(null);
    setInput('');
  };

  const renderMessage = (msg, i) => {
    const isBot = msg.role === 'assistant';
    // Simple bold markdown rendering
    const formatted = msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
    return (
      <div key={i} style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end', marginBottom: 10 }}>
        {isBot && (
          <div style={styles.botAvatar}>🤖</div>
        )}
        <div style={isBot ? styles.botBubble : styles.userBubble}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ─── FLOATING BUTTON ─── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={styles.floatBtn}
        title="Chat with FixBot AI"
      >
        {open ? <FiX size={24} /> : <FiMessageCircle size={24} />}
        {!open && <span style={styles.floatLabel}>Report with AI</span>}
      </button>

      {/* ─── CHAT WINDOW ─── */}
      {open && (
        <div style={styles.chatWindow}>
          {/* Header */}
          <div style={styles.chatHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={styles.botIcon}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>FixBot</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>AI Report Assistant • Powered by Llama 3</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleReset} style={styles.headerBtn} title="Start over">↺</button>
              <button onClick={() => setOpen(false)} style={styles.headerBtn}><FiX size={14} /></button>
            </div>
          </div>

          {/* Messages */}
          <div style={styles.messagesArea}>
            {messages.map(renderMessage)}

            {/* Report Preview Card */}
            {reportReady && (
              <div style={styles.reportCard}>
                <div style={styles.reportCardHeader}>
                  <FiCheckCircle size={16} color="#0f4c35" />
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0f4c35' }}>Report Ready to Submit</span>
                </div>
                <div style={styles.reportCardGrid}>
                  <div style={styles.reportField}><span style={styles.fieldLabel}>Title</span><span style={styles.fieldValue}>{reportReady.title}</span></div>
                  <div style={styles.reportField}><span style={styles.fieldLabel}>Category</span><span style={styles.fieldValue}>{reportReady.category?.replace(/_/g, ' ')}</span></div>
                  <div style={styles.reportField}><span style={styles.fieldLabel}>Urgency</span><span style={{ ...styles.fieldValue, color: reportReady.urgency === 'critical' ? '#dc2626' : reportReady.urgency === 'high' ? '#ea580c' : '#d97706', fontWeight: 700 }}>{reportReady.urgency?.toUpperCase()}</span></div>
                  <div style={styles.reportField}><span style={styles.fieldLabel}>Location</span><span style={styles.fieldValue}>{reportReady.location}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    onClick={handleSubmitReport}
                    disabled={submitting}
                    style={styles.submitBtn}
                  >
                    {submitting ? <FiLoader size={13} /> : <FiZap size={13} />}
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                  <button onClick={() => navigate('/submit')} style={styles.editBtn}>
                    Edit Manually
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                <div style={styles.botAvatar}>🤖</div>
                <div style={{ ...styles.botBubble, color: '#9ab5a5' }}>
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={styles.dot1}>●</span>
                    <span style={styles.dot2}>●</span>
                    <span style={styles.dot3}>●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={styles.inputArea}>
            <input
              ref={inputRef}
              style={styles.input}
              placeholder="Type your problem here..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={styles.sendBtn}
            >
              <FiSend size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce1 { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes bounce2 { 0%,20%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes bounce3 { 0%,40%,80%,100%{transform:scale(0)} 60%{transform:scale(1)} }
      `}</style>
    </>
  );
}

const styles = {
  floatBtn: {
    position: 'fixed', bottom: 'calc(28px + env(safe-area-inset-bottom))', right: 28, zIndex: 1000,
    background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)',
    color: 'white', border: 'none', borderRadius: 50,
    padding: '14px 20px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 10,
    boxShadow: '0 4px 24px rgba(15,76,53,0.4)',
    fontSize: 15, fontWeight: 700,
  },
  floatLabel: { fontSize: 14, fontWeight: 700 },
  chatWindow: {
    position: 'fixed',
    bottom: 'calc(90px + env(safe-area-inset-bottom))',
    right: 28, zIndex: 999,
    width: 'min(360px, calc(100vw - 32px))',
    height: 'min(520px, calc(100vh - 160px))',
    background: 'white', borderRadius: 20,
    boxShadow: '0 8px 48px rgba(15,76,53,0.2)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', border: '1px solid #e2e8e4',
  },
  chatHeader: {
    background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)',
    padding: '14px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  botIcon: { fontSize: 24, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  messagesArea: { flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column' },
  botAvatar: { fontSize: 18, width: 28, height: 28, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, alignSelf: 'flex-end' },
  botBubble: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', fontSize: 13, color: '#0d1f18', lineHeight: 1.5, maxWidth: '80%' },
  userBubble: { background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)', borderRadius: '18px 18px 4px 18px', padding: '10px 14px', fontSize: 13, color: 'white', lineHeight: 1.5, maxWidth: '80%' },
  reportCard: { background: '#f0fdf4', border: '1.5px solid #0f4c35', borderRadius: 14, padding: 14, margin: '8px 0' },
  reportCardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  reportCardGrid: { display: 'flex', flexDirection: 'column', gap: 6 },
  reportField: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 11, color: '#9ab5a5', fontWeight: 700, textTransform: 'uppercase' },
  fieldValue: { fontSize: 12, color: '#0d1f18', fontWeight: 600, textAlign: 'right', maxWidth: '65%' },
  submitBtn: { flex: 1, background: '#0f4c35', color: 'white', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  editBtn: { background: 'none', border: '1.5px solid #0f4c35', color: '#0f4c35', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  inputArea: { padding: '12px 14px', borderTop: '1px solid #f0f4f2', display: 'flex', gap: 8 },
  input: { flex: 1, border: '1.5px solid #e2e8e4', borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  sendBtn: { background: '#0f4c35', color: 'white', border: 'none', borderRadius: 12, width: 42, height: 42, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dot1: { fontSize: 8, animation: 'bounce1 1.4s infinite ease-in-out' },
  dot2: { fontSize: 8, animation: 'bounce2 1.4s infinite ease-in-out' },
  dot3: { fontSize: 8, animation: 'bounce3 1.4s infinite ease-in-out' },
};
