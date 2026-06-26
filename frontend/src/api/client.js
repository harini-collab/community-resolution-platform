import axios from 'axios';

// Bug fix 1: Changed baseURL from absolute 'http://localhost:5000/api' to
// relative '/api'. The Vite proxy (vite.config.js) forwards /api/* to the
// backend in dev. In production, serving the React app from the same origin
// as the API makes relative URLs work without any extra config.
// The VITE_API_URL env var can still override this for special deployments
// (e.g. a CDN-hosted SPA talking to a separate API domain).

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Bug fix 2: Added response interceptor to handle 401 (expired/invalid token).
// Without this, a stale token would cause every API call to silently return 401
// while React state still showed the user as logged in, leaving the UI broken.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthAttempt) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/admin-access') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
