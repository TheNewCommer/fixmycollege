import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Navbar from './components/Navbar';
import ChatbotWidget from './components/ChatbotWidget';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import SubmitReport from './pages/SubmitReport';
import WellbeingWall from './pages/WellbeingWall';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminPanel from './pages/SuperAdminPanel';
import Analytics from './pages/Analytics';
import MyReports from './pages/MyReports';
import Profile from './pages/Profile';

// ─── PROTECTED ROUTE ──────────────────────────────────────
const ProtectedRoute = ({ children, adminOnly = false, superOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (superOnly && user.role !== 'superadmin') return <Navigate to="/" replace />;
  if (adminOnly && user.role !== 'admin' && user.role !== 'superadmin') return <Navigate to="/" replace />;
  return children;
};

// ─── PUBLIC ROUTE (redirect if logged in) ─────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (user) return <Navigate to="/reports" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <ChatbotWidget />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="/wellbeing" element={<WellbeingWall />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/submit" element={<ProtectedRoute><SubmitReport /></ProtectedRoute>} />
        <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/superadmin" element={<ProtectedRoute superOnly><SuperAdminPanel /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              },
              success: { iconTheme: { primary: '#0f4c35', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
