'use client';

import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

// ─── State shape ──────────────────────────────────────────────────────────

const initialState = {
  user     : null,
  token    : null,
  loading  : true,   // true on first mount while we check localStorage
  error    : null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'AUTH_INIT':
      return { ...state, user: action.user, token: action.token, loading: false };
    case 'AUTH_SUCCESS':
      return { ...state, user: action.user, token: action.token, loading: false, error: null };
    case 'AUTH_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'AUTH_LOGOUT':
      return { ...initialState, loading: false };
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.updates } };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();

  // On mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('dc_token');
    const user  = localStorage.getItem('dc_user');
    if (token && user) {
      try {
        const parsed = JSON.parse(user);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        dispatch({ type: 'AUTH_INIT', user: parsed, token });
      } catch {
        localStorage.removeItem('dc_token');
        localStorage.removeItem('dc_user');
        dispatch({ type: 'AUTH_INIT', user: null, token: null });
      }
    } else {
      dispatch({ type: 'AUTH_INIT', user: null, token: null });
    }
  }, []);

  // ── Save token to axios headers + localStorage whenever it changes ──────
  const persistAuth = useCallback((token, user) => {
    localStorage.setItem('dc_token', token);
    localStorage.setItem('dc_user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    dispatch({ type: 'AUTH_SUCCESS', user, token });
  }, []);

  // ── Patient login ────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    const { data } = await api.post('/auth/login', { email, password });
    persistAuth(data.data.token, data.data.user);
    return data.data.user;
  }, [persistAuth]);

  // ── Staff login (secretary / doctor) ─────────────────────────────────────
  const staffLogin = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    const { data } = await api.post('/auth/staff/login', { email, password });
    persistAuth(data.data.token, data.data.user);
    return data.data.user;
  }, [persistAuth]);

  // ── Patient register ─────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    dispatch({ type: 'AUTH_LOADING' });
    const { data } = await api.post('/auth/register', formData);
    persistAuth(data.data.token, data.data.user);
    return data.data.user;
  }, [persistAuth]);

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('dc_token');
    localStorage.removeItem('dc_user');
    delete api.defaults.headers.common['Authorization'];
    dispatch({ type: 'AUTH_LOGOUT' });
    router.push('/');
  }, [router]);

  // ── Update local user data (after profile edit) ──────────────────────────
  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', updates });
    const stored = localStorage.getItem('dc_user');
    if (stored) {
      try {
        const current = JSON.parse(stored);
        localStorage.setItem('dc_user', JSON.stringify({ ...current, ...updates }));
      } catch { /* noop */ }
    }
  }, []);

  // ── Role helpers ─────────────────────────────────────────────────────────
  const isPatient   = state.user?.role === 'patient';
  const isSecretary = state.user?.role === 'secretary';
  const isDoctor    = state.user?.role === 'doctor';
  const isLoggedIn  = !!state.token;

  // ── Role-based redirect after login ──────────────────────────────────────
  const redirectByRole = useCallback((user) => {
    switch (user.role) {
      case 'patient'   : router.push('/dashboard');           break;
      case 'secretary' : router.push('/secretary/dashboard'); break;
      case 'doctor'    : router.push('/doctor/schedule');     break;
      default          : router.push('/');
    }
  }, [router]);

  const value = {
    ...state,
    login,
    staffLogin,
    register,
    logout,
    updateUser,
    redirectByRole,
    isPatient,
    isSecretary,
    isDoctor,
    isLoggedIn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
