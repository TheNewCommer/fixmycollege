import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// ─── ATTACH TOKEN ─────────────────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('fmc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── HANDLE 401 ───────────────────────────────────────────
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fmc_token');
      localStorage.removeItem('fmc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── AUTH ─────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.patch('/auth/profile', data),
};

// ─── REPORTS ──────────────────────────────────────────────
export const reportsAPI = {
  create: (formData) => API.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params) => API.get('/reports', { params }),
  getOne: (id) => API.get(`/reports/${id}`),
  upvote: (id) => API.post(`/reports/${id}/upvote`),
  addComment: (id, text) => API.post(`/reports/${id}/comments`, { text }),
  getMyReports: () => API.get('/reports/my/reports'),
};

// ─── ADMIN ────────────────────────────────────────────────
export const adminAPI = {
  getReports: (params) => API.get('/admin/reports', { params }),
  updateStatus: (id, data) => API.patch(`/admin/reports/${id}/status`, data),
  uploadProof: (id, formData) => API.post(`/admin/reports/${id}/proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getTeam: () => API.get('/admin/team'),
  createAdmin: (data) => API.post('/admin/create-admin', data),
};

// ─── WELLBEING ────────────────────────────────────────────
export const wellbeingAPI = {
  create: (data) => API.post('/wellbeing', data),
  getAll: (params) => API.get('/wellbeing', { params }),
  support: (id) => API.post(`/wellbeing/${id}/support`),
  addReply: (id, text) => API.post(`/wellbeing/${id}/reply`, { text }),
  getRaggingPosts: () => API.get('/wellbeing/ragging/private'),
  acknowledgeRagging: (id) => API.patch(`/wellbeing/ragging/${id}/acknowledge`),
};

// ─── AI ───────────────────────────────────────────────────
export const aiAPI = {
  classify: (description) => API.post('/ai/classify', { description }),
  sentiment: (content, category) => API.post('/ai/sentiment', { content, category }),
  detectDuplicate: (description, category) => API.post('/ai/detect-duplicate', { description, category }),
};

// ─── STATS ────────────────────────────────────────────────
export const statsAPI = {
  get: () => API.get('/stats'),
};

export default API;
