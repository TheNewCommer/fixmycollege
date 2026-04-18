import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { reportsAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiX, FiSend, FiAlertTriangle, FiZap, FiLoader } from 'react-icons/fi';

const CATEGORIES = [
  { value: 'cleanliness', label: '🗑️ Cleanliness / Dustbin Overflow' },
  { value: 'hostel_infrastructure', label: '🏠 Hostel Infrastructure (door, fan, etc.)' },
  { value: 'water', label: '💧 Water / Tap Leakage' },
  { value: 'electricity', label: '⚡ Electricity / Light Issue' },
  { value: 'mess', label: '🍽️ Mess / Food Quality' },
  { value: 'campus_infrastructure', label: '🏛️ Campus Infrastructure' },
  { value: 'internet_tech', label: '📶 Internet / WiFi / Lab Equipment' },
  { value: 'security', label: '🔒 Security Issue' },
  { value: 'other_civic', label: '📌 Other Civic Issue' },
];

const BUILDINGS = [
  { value: 'boys_hostel_1', label: 'Boys Hostel 1' },
  { value: 'boys_hostel_2', label: 'Boys Hostel 2' },
  { value: 'girls_hostel', label: 'Girls Hostel' },
  { value: 'mess_hall', label: 'Mess Hall' },
  { value: 'main_building', label: 'Main Building' },
  { value: 'campus_ground', label: 'Campus Ground' },
  { value: 'library', label: 'Library' },
  { value: 'lab', label: 'Laboratory' },
  { value: 'other', label: 'Other' },
];

const URGENCY = [
  { value: 'low', label: '🟢 Low — Can wait a few days', color: '#15803d' },
  { value: 'medium', label: '🟡 Medium — Should be fixed soon', color: '#854d0e' },
  { value: 'high', label: '🟠 High — Needs attention today', color: '#c2410c' },
  { value: 'critical', label: '🔴 Critical — Immediate action needed', color: '#b91c1c' },
];

export default function SubmitReport() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const aiTimerRef = useRef(null);

  const [form, setForm] = useState({ title: '', description: '', category: '', location: '', building: '', urgency: 'medium', isAnonymous: true });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiApplied, setAiApplied] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  const runAIClassification = async (description) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data } = await aiAPI.classify(description);
      if (data.success) setAiResult(data.classification);
    } catch (err) {
      console.error('AI error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const checkDuplicates = async (description, category) => {
    if (!description || !category) return;
    setDuplicateLoading(true);
    setDuplicateCheck(null);
    try {
      const { data } = await aiAPI.detectDuplicate(description, category);
      if (data.success && data.hasDuplicate) setDuplicateCheck(data);
    } catch (err) {
      console.error('Duplicate check error:', err);
    } finally {
      setDuplicateLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'description') {
      clearTimeout(aiTimerRef.current);
      setAiApplied(false);
      if (value.length >= 15) {
        aiTimerRef.current = setTimeout(() => runAIClassification(value), 1500);
      }
    }
    if (name === 'category' && form.description.length > 15) {
      checkDuplicates(form.description, value);
    }
  };

  const applyAISuggestions = () => {
    if (!aiResult) return;
    setForm(f => ({ ...f, title: aiResult.title || f.title, category: aiResult.category || f.category, urgency: aiResult.urgency || f.urgency }));
    setAiApplied(true);
    toast.success('AI suggestions applied!');
    if (aiResult.category) checkDuplicates(form.description, aiResult.category);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => { setPhoto(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.location) { toast.error('Please fill all required fields'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);
      const { data } = await reportsAPI.create(fd);
      toast.success('Report submitted! Admin has been notified via SMS. 📱');
      navigate(`/reports/${data.report._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <div style={styles.header}>
        <h1 style={styles.title}>Report an Issue</h1>
        <p style={styles.subtitle}>Fill this form to report a civic problem. The responsible admin will be notified immediately via SMS.</p>
      </div>
      <div className="card" style={{ padding: 32 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Describe the Problem * <span style={styles.aiLabel}>✨ AI will auto-fill details</span></label>
            <textarea className="form-input" name="description" placeholder="Describe the problem in detail... e.g. The dustbin near room 204 has been overflowing since 2 days." value={form.description} onChange={handleChange} rows={4} maxLength={1000} required />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#9ab5a5' }}>Write at least 15 characters for AI to analyze</span>
              <span style={{ fontSize: 11, color: '#9ab5a5' }}>{form.description.length}/1000</span>
            </div>
          </div>

          {aiLoading && (
            <div style={styles.aiBox}>
              <FiLoader size={16} style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>AI is analyzing your description...</span>
            </div>
          )}

          {aiResult && !aiApplied && !aiLoading && (
            <div style={styles.aiResultBox}>
              <div style={styles.aiResultHeader}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f4c35' }}>✨ AI Analysis Complete</span>
                <button type="button" onClick={applyAISuggestions} style={styles.applyBtn}><FiZap size={13} /> Apply Suggestions</button>
              </div>
              <div style={styles.aiResultGrid}>
                <div style={styles.aiResultItem}><span style={styles.aiResultLabel}>Suggested Title</span><span style={styles.aiResultValue}>{aiResult.title}</span></div>
                <div style={styles.aiResultItem}><span style={styles.aiResultLabel}>Category</span><span style={styles.aiResultValue}>{aiResult.category?.replace(/_/g, ' ')}</span></div>
                <div style={styles.aiResultItem}><span style={styles.aiResultLabel}>Urgency</span><span style={{ ...styles.aiResultValue, color: aiResult.urgency === 'critical' ? '#dc2626' : aiResult.urgency === 'high' ? '#ea580c' : '#d97706' }}>{aiResult.urgency}</span></div>
                <div style={styles.aiResultItem}><span style={styles.aiResultLabel}>Reason</span><span style={{ ...styles.aiResultValue, fontSize: 11 }}>{aiResult.reason}</span></div>
              </div>
            </div>
          )}

          {aiApplied && (
            <div style={styles.aiAppliedBox}><FiZap size={14} /> AI suggestions applied! You can still edit them.</div>
          )}

          {duplicateLoading && (
            <div style={styles.aiBox}><FiLoader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /><span style={{ fontSize: 13 }}>Checking for similar existing reports...</span></div>
          )}

          {duplicateCheck?.hasDuplicate && (
            <div style={styles.dupWarningBox}>
              <FiAlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>⚠️ Similar issue already reported!</p>
                <p style={{ fontSize: 12, color: '#78350f', marginBottom: 8 }}>{duplicateCheck.reason}</p>
                {duplicateCheck.similarReports?.map(r => (
                  <Link key={r._id} to={`/reports/${r._id}`} target="_blank" style={{ display: 'block', fontSize: 12, color: '#0f4c35', fontWeight: 600, marginBottom: 4, textDecoration: 'underline' }}>
                    → {r.title} ({r.status}) — {r.upvoteCount || 0} upvotes
                  </Link>
                ))}
                <p style={{ fontSize: 11, color: '#92400e', marginTop: 6 }}>Consider upvoting the existing report instead. But if different, continue submitting.</p>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-input" name="category" value={form.category} onChange={handleChange} required>
              <option value="">Select issue category</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Issue Title *</label>
            <input className="form-input" name="title" placeholder="e.g. Dustbin overflowing near Room 204" value={form.title} onChange={handleChange} maxLength={100} required />
            <div style={styles.charCount}>{form.title.length}/100</div>
          </div>

          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Specific Location *</label>
              <input className="form-input" name="location" placeholder="e.g. Room 204, 2nd floor" value={form.location} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Building / Area</label>
              <select className="form-input" name="building" value={form.building} onChange={handleChange}>
                <option value="">Select building</option>
                {BUILDINGS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Urgency Level *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {URGENCY.map(u => (
                <label key={u.value} style={{ ...styles.urgencyOption, ...(form.urgency === u.value ? { borderColor: u.color, background: '#fafff9' } : {}) }}>
                  <input type="radio" name="urgency" value={u.value} checked={form.urgency === u.value} onChange={handleChange} style={{ accentColor: u.color }} />
                  <span style={{ fontSize: 14 }}>{u.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Photo Evidence (Optional but recommended)</label>
            {preview ? (
              <div style={styles.previewWrap}>
                <img src={preview} alt="Preview" style={styles.previewImg} />
                <button type="button" onClick={removePhoto} style={styles.removeBtn}><FiX size={16} /></button>
              </div>
            ) : (
              <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
                <FiUploadCloud size={32} style={{ color: '#9ab5a5', marginBottom: 8 }} />
                <p style={{ fontSize: 14, color: '#6b8a78', fontWeight: 500 }}>Click to upload a photo</p>
                <p style={{ fontSize: 12, color: '#9ab5a5', marginTop: 4 }}>JPG, PNG or WebP — max 5MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          </div>

          <div style={styles.anonRow}>
            <label style={styles.anonLabel}>
              <input type="checkbox" name="isAnonymous" checked={form.isAnonymous} onChange={handleChange} style={{ accentColor: '#0f4c35', width: 16, height: 16 }} />
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Submit Anonymously</span>
                <p style={{ fontSize: 12, color: '#9ab5a5', margin: '2px 0 0' }}>Your identity will be hidden from other students.</p>
              </div>
            </label>
          </div>

          <div style={styles.smsNote}>
            <FiAlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>After submission, the responsible admin will receive an <strong>instant SMS</strong> on their phone.</span>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Submitting...</> : <><FiSend /> Submit Report</>}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  header: { marginBottom: 24 },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#0d1f18', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b8a78', lineHeight: 1.6 },
  aiLabel: { marginLeft: 8, fontSize: 11, background: '#f0fdf4', color: '#0f4c35', padding: '2px 8px', borderRadius: 100, fontWeight: 600 },
  charCount: { fontSize: 11, color: '#9ab5a5', textAlign: 'right', marginTop: 3 },
  urgencyOption: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1.5px solid #e2e8e4', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' },
  previewWrap: { position: 'relative', borderRadius: 12, overflow: 'hidden', height: 180 },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  removeBtn: { position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  anonRow: { padding: '14px 16px', background: '#f8faf9', borderRadius: 10, marginBottom: 16 },
  anonLabel: { display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' },
  smsNote: { display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e', marginBottom: 16, lineHeight: 1.5 },
  aiBox: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 13, color: '#0f4c35', marginBottom: 16 },
  aiResultBox: { background: '#f0fdf4', border: '1.5px solid #0f4c35', borderRadius: 12, padding: 16, marginBottom: 16 },
  aiResultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  applyBtn: { display: 'flex', alignItems: 'center', gap: 6, background: '#0f4c35', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  aiResultGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  aiResultItem: { display: 'flex', flexDirection: 'column', gap: 3 },
  aiResultLabel: { fontSize: 10, color: '#9ab5a5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  aiResultValue: { fontSize: 13, fontWeight: 600, color: '#0d1f18' },
  aiAppliedBox: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, fontSize: 13, color: '#15803d', fontWeight: 600, marginBottom: 16 },
  dupWarningBox: { display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: 12, marginBottom: 16 },
};
