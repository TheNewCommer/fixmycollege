import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('fmc_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('fmc_token');
      localStorage.removeItem('fmc_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('fmc_token', data.token);
    localStorage.setItem('fmc_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('fmc_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('fmc_token');
    localStorage.removeItem('fmc_user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const isRaggingAdmin = user?.adminDomain === 'ragging' || isSuperAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isSuperAdmin, isRaggingAdmin, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
