import axios from 'axios';

const api = axios.create({
  baseURL : process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : '/api',
  timeout  : 15000,
  headers  : { 'Content-Type': 'application/json' },
});

// ─── Response interceptor ──────────────────────────────────────────────────
// Unwrap the { success, data, message } envelope so callers get `data.data`
// and redirect to login on 401.

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale token
      localStorage.removeItem('dc_token');
      localStorage.removeItem('dc_user');
      delete api.defaults.headers.common['Authorization'];

      // Redirect — works outside React component tree
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
